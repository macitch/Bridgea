import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged,
  User,
  sendEmailVerification,
  UserCredential,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
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

const generateDefaultAvatar = (displayName: string): string => {
    const encodedName = encodeURIComponent(displayName);
    return `https://ui-avatars.com/api/?name=${encodedName}&background=random&rounded=true`;
};

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

//-------------------------------------------------------------------------------------------------------
// Sign Up Function
//-------------------------------------------------------------------------------------------------------

export const signUp = async (
  email: string,
  password: string,
  displayName: string,
  workspaceName: string
): Promise<SignUpResponse> => {
  try {
    if (!email || !password || !displayName || !workspaceName) {
      throw new Error("All fields are required");
    }

    // Create the user with Firebase Auth
    const userCredential: UserCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user.email) {
      throw new Error("User email is unexpectedly null.");
    }

    // Generate a default avatar from the displayName initials
    const defaultAvatar = generateDefaultAvatar(displayName);

    // Update the user's Firebase Auth profile with the displayName and default photoURL
    await updateProfile(user, { displayName, photoURL: defaultAvatar });

    // Create the Firestore user document (conforming to FirestoreUser interface)
    await setDoc(doc(db, "users", user.uid), {
      displayName,
      email: user.email,
      workspaceName,
      photoURL: defaultAvatar,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
      emailVerified: false,
      role: "owner",
    });

    // Create a workspace document in Firestore associated with the user
    await setDoc(doc(db, "workspaces", workspaceName), {
      owner: user.uid,
      members: [user.uid],
      createdAt: serverTimestamp(),
    });

    // Send email verification to the new user
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

//-------------------------------------------------------------------------------------------------------
// Sign In Function
//-------------------------------------------------------------------------------------------------------

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


//-------------------------------------------------------------------------------------------------------
// Google Sign In Flow
//-------------------------------------------------------------------------------------------------------

export const signInWithGoogle = async (): Promise<{ user: User; workspaceNameExists: boolean }> => {

  try {
    const provider = new GoogleAuthProvider();
    const userCredential: UserCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    if (!user.email) {
      throw new Error ("User email is unexpectedly null.")
    }

    // Reference to the user's Firestore document
    const userDocRef = doc(db,"users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    let workspaceNameExists = false;

    if(userDocSnap.exists()) {
      const userData = userDocSnap.data();
      if(userData.workspaceName && userData.workspaceName !== "") {
        console.log("🚨 No workspace name found.")
      } 
    } else {
      const defaultAvatar = generateDefaultAvatar(user.displayName || "User");
      await setDoc(userDocRef, {
        displayName: user.displayName,
        email: user.email,
        workspaceName: "", 
        photoURL: user.photoURL || defaultAvatar,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        emailVerified: user.emailVerified
      });
    }

    // Optionally, update the last login timestamp
    await updateUserDocument(user.uid, { lastLogin: serverTimestamp()});
    return { user, workspaceNameExists };
  } catch (error: unknown) {
    throw new Error(formatFirebaseError(error));
  }
};

//-------------------------------------------------------------------------------------------------------
// Send Verification Email
//-------------------------------------------------------------------------------------------------------

export const sendVerificationEmail = async (user: User): Promise<boolean> => {
  try {
    await sendEmailVerification(user);
    return true;
  } catch (error: unknown) {
    throw new Error(formatFirebaseError(error));
  }
};

//-------------------------------------------------------------------------------------------------------
// Send Password Reset
//-------------------------------------------------------------------------------------------------------

export const sendPasswordReset = async (email: string): Promise<boolean> => {
  try {
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error: unknown) {
    throw new Error(formatFirebaseError(error));
  }
};

//-------------------------------------------------------------------------------------------------------
// Logout Function
//-------------------------------------------------------------------------------------------------------

export const logout = async (): Promise<boolean> => {
  try {
    await signOut(auth);
    return true;
  } catch (error: unknown) {
    throw new Error(formatFirebaseError(error));
  }
};