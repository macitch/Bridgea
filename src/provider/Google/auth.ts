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
import { doc, setDoc, getDoc, serverTimestamp, query, onSnapshot, updateDoc, collection } from "firebase/firestore";
import { auth, db } from "../Google/firebase";
import { FirebaseError } from "firebase/app";

// ----------------------------------------
// TypeScript Interfaces for User Authentication Data
// ----------------------------------------

// Represents the basic authenticated user data.
interface UserAuthData {
  uid: string;
  email: string;
  emailVerified: boolean;
}

// Extends UserAuthData with workspace name, returned on sign up.
interface SignUpResponse extends UserAuthData {
  workspaceName: string;
}

// ----------------------------------------
// Utility Functions
// ----------------------------------------

// Generates a default avatar URL using an external avatar generation service.
const generateDefaultAvatar = (displayName: string): string => {
  const encodedName = encodeURIComponent(displayName);
  return `https://ui-avatars.com/api/?name=${encodedName}&background=random&rounded=true`;
};

// ----------------------------------------
// Firebase Error Handling
// ----------------------------------------

// A mapping of Firebase error codes to human-friendly error messages.
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

// Formats Firebase errors using the errorMessages mapping, falling back to the original message.
export const formatFirebaseError = (error: unknown): string => {
  if (error instanceof FirebaseError) {
    return errorMessages[error.code] || error.message;
  }
  return "An unexpected error occurred.";
};

// ----------------------------------------
// Auth State Listener
// ----------------------------------------

// Initializes the Firebase auth state listener and passes the current user to the provided callback.
export const initAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// ----------------------------------------
// User Document Update
// ----------------------------------------

// Centralized function to update the user's Firestore document with new data (merging with existing fields).
const updateUserDocument = async (uid: string, data: Record<string, any>) => {
  await setDoc(doc(db, "users", uid), data, { merge: true });
};

// -------------------------------------------------------------------------------------------------------
// Sign Up Function
// -------------------------------------------------------------------------------------------------------

export const signUp = async (
  email: string,
  password: string,
  displayName: string,
  workspaceName: string
): Promise<SignUpResponse> => {
  try {
    // Validate that all required fields are provided.
    if (!email || !password || !displayName || !workspaceName) {
      throw new Error("All fields are required");
    }

    // Create a new user with email and password.
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user.email) throw new Error("User email is unexpectedly null.");

    // Generate a default avatar based on the user's display name.
    const defaultAvatar = generateDefaultAvatar(displayName);
    // Update the user's profile with the display name and default avatar.
    await updateProfile(user, { displayName, photoURL: defaultAvatar });

    // Create a unique workspace ID by combining the user UID and a sanitized workspace name.
    const uniqueWorkspaceId = `${user.uid}-${workspaceName.replace(/\s+/g, "-").toLowerCase()}`;

    // In parallel, update the user's document and create a new workspace document in Firestore.
    await Promise.all([
      setDoc(doc(db, "users", user.uid), {
        displayName,
        email: user.email,
        workspaceName: uniqueWorkspaceId,
        photoURL: defaultAvatar,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        emailVerified: false,
        role: "owner",
      }),
      setDoc(doc(db, "workspaces", uniqueWorkspaceId), {
        name: workspaceName,
        owner: user.uid,
        members: [user.uid],
        createdAt: serverTimestamp(),
      }),
    ]);

    // Send an email verification to the newly registered user.
    await sendEmailVerification(user);

    // Return the sign-up response with the new user's information.
    return {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
      workspaceName: uniqueWorkspaceId,
    };
  } catch (error) {
    // Format and throw the error if any issue occurs during sign-up.
    throw new Error(formatFirebaseError(error));
  }
};

// -------------------------------------------------------------------------------------------------------
// Sign In Function
// -------------------------------------------------------------------------------------------------------

export const signIn = async (email: string, password: string): Promise<UserAuthData> => {
  try {
    // Sign in the user using email and password.
    const userCredential: UserCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    if (!user.email) {
      throw new Error("User email is unexpectedly null.");
    }

    // Update the user's last login timestamp.
    await updateUserDocument(user.uid, { lastLogin: serverTimestamp() });

    // Return the authenticated user's data.
    return {
      uid: user.uid,
      email: user.email,
      emailVerified: user.emailVerified,
    };
  } catch (error: unknown) {
    throw new Error(formatFirebaseError(error));
  }
};

// -------------------------------------------------------------------------------------------------------
// Google Sign In Flow
// -------------------------------------------------------------------------------------------------------

export const signInWithGoogle = async (): Promise<{ user: User; workspaceNameExists: boolean }> => {
  try {
    // Create a GoogleAuthProvider instance.
    const provider = new GoogleAuthProvider();
    // Sign in with Google using a popup.
    const userCredential: UserCredential = await signInWithPopup(auth, provider);
    const user = userCredential.user;

    if (!user.email) {
      throw new Error("User email is unexpectedly null.");
    }

    // Retrieve the user's Firestore document to check if a workspace already exists.
    const userDocRef = doc(db, "users", user.uid);
    const userDocSnap = await getDoc(userDocRef);
    let workspaceNameExists = false;

    if (userDocSnap.exists()) {
      const userData = userDocSnap.data();
      if (userData.workspaceName && userData.workspaceName !== "") {
        console.log("Workspace name exists.");
        workspaceNameExists = true;
      }
    } else {
      // If the user document does not exist, create it with a default avatar.
      const defaultAvatar = generateDefaultAvatar(user.displayName || "User");
      await setDoc(userDocRef, {
        displayName: user.displayName,
        email: user.email,
        workspaceName: "",
        photoURL: user.photoURL || defaultAvatar,
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
        emailVerified: user.emailVerified,
      });
    }

    // Update the user's last login timestamp.
    await updateUserDocument(user.uid, { lastLogin: serverTimestamp() });
    return { user, workspaceNameExists };
  } catch (error: unknown) {
    throw new Error(formatFirebaseError(error));
  }
};

// -------------------------------------------------------------------------------------------------------
// Send Verification Email
// -------------------------------------------------------------------------------------------------------

export const sendVerificationEmail = async (user: User): Promise<boolean> => {
  try {
    // Send an email verification to the user.
    await sendEmailVerification(user);
    return true;
  } catch (error: unknown) {
    throw new Error(formatFirebaseError(error));
  }
};

// -------------------------------------------------------------------------------------------------------
// Send Password Reset
// -------------------------------------------------------------------------------------------------------

export const sendPasswordReset = async (email: string): Promise<boolean> => {
  try {
    // Send a password reset email using Firebase auth.
    await sendPasswordResetEmail(auth, email);
    return true;
  } catch (error: unknown) {
    throw new Error(formatFirebaseError(error));
  }
};

// -------------------------------------------------------------------------------------------------------
// Logout Function
// -------------------------------------------------------------------------------------------------------

export const logout = async (): Promise<boolean> => {
  try {
    // Sign out the user from Firebase authentication.
    await signOut(auth);
    return true;
  } catch (error: unknown) {
    throw new Error(formatFirebaseError(error));
  }
};

// -------------------------------------------------------------------------------------------------------
// Firestore Functions for User Links
// -------------------------------------------------------------------------------------------------------

// Sets up a real-time listener for the authenticated user's links.
// The callback is triggered whenever there is a change in the user's "links" subcollection.
export const getUserLinks = (uid: string, callback: any) => {
  const q = query(collection(db, "users", uid, "links"));
  return onSnapshot(q, callback);
};

// Updates a specific link document for the given user with the provided updated data.
export const updateUserLink = async (uid: string, id: string, updatedLink: any) => {
  const docRef = doc(db, "users", uid, "links", id);
  await updateDoc(docRef, updatedLink);
};