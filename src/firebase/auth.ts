import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
  sendEmailVerification,
  UserCredential,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebase";
import { FirebaseError } from "firebase/app";

// Define TypeScript Interfaces
interface UserAuthData {
  uid: string;
  email: string;
  emailVerified: boolean;
}
interface SignUpResponse extends UserAuthData {
  workspaceName: string;
}

// Firebase Error Messages
const errorMessages: Record<string, string> = {
  "auth/email-already-in-use": "Email already registered",
  "auth/invalid-email": "Invalid email address",
  "auth/weak-password": "Password must be at least 6 characters",
  "auth/user-not-found": "No account found with this email",
  "auth/wrong-password": "Incorrect password",
  "auth/too-many-requests": "Too many attempts. Try again later",
  "auth/missing-email": "Please enter an email address",
  "auth/network-request-failed": "Network error. Please check your connection.",
};

export const formatFirebaseError = (error: unknown): string => {
  if (error instanceof FirebaseError) {
    return errorMessages[error.code] || error.message;
  }
  return "An unexpected error occurred.";
};

// Firebase auth state listener
export const initAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Centralized Firestore update function
const updateUserDocument = async (uid: string, data: Record<string, any>) => {
  await setDoc(doc(db, "users", uid), data, { merge: true });
};

// Sign Up Function
export const signUp = async (
  email: string,
  password: string,
  workspaceName: string
): Promise<SignUpResponse> => {
  try {
    if (!email || !password || !workspaceName) {
      throw new Error("All fields are required");
    }

    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user.email) {
      throw new Error("User email is unexpectedly null.");
    }

    // Create user document in Firestore
    await setDoc(doc(db, "users", user.uid), {
      email: user.email,
      workspaceName,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      emailVerified: false,
      role: "owner",
    });

    // Create workspace document in Firestore
    await setDoc(doc(db, "workspaces", workspaceName), {
      owner: user.uid,
      members: [user.uid],
      createdAt: serverTimestamp(),
    });

    // Send email verification
    await sendEmailVerification(user);

    return {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      workspaceName,
    };
  } catch (error: unknown) {
    throw new Error(formatFirebaseError(error));
  }
};

// Sign In Function
export const signIn = async (email: string, password: string): Promise<UserAuthData> => {
  try {
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user.email) {
      throw new Error("User email is unexpectedly null.");
    }

    // Update last login timestamp
    await updateUserDocument(user.uid, { lastLogin: serverTimestamp() });

    return {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
    };
  } catch (error: unknown) {
    throw new Error(formatFirebaseError(error));
  }
};

// Send Email Verification
export const sendVerificationEmail = async (user: User): Promise<boolean> => {
  try {
    await sendEmailVerification(user);
    return true;
  } catch (error: unknown) {
    throw new Error(formatFirebaseError(error));
  }
};

// Send Password Reset Email
export const sendPasswordReset = async (email: string): Promise<boolean> => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error: unknown) {
    throw new Error(formatFirebaseError(error));
  }
};

// Logout Function
export const logout = async (): Promise<boolean> => {
  try {
    await signOut(auth);
    return true;
  } catch (error: unknown) {
    throw new Error(formatFirebaseError(error));
  }
};