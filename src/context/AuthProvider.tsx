import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/provider/Google/firebase";
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/router";
import { FirestoreUser } from "@/models/users";

// Define the shape of the authentication context.
interface AuthContextType {
  user: User | null;               // Firebase authenticated user object.
  loading: boolean;                // Indicates if authentication is still loading.
  userData: FirestoreUser | null;  // Additional user data stored in Firestore.
  initialized: boolean;            // Indicates if the auth provider has completed initialization.
}

// Create the AuthContext.
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook to use the AuthContext.
// Throws an error if used outside of an AuthProvider.
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// AuthProvider component wraps the app and provides authentication state.
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Local state for Firebase user and additional Firestore user data.
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<FirestoreUser | null>(null);
  // Local state for loading and initialization flags.
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  // Get Next.js router to perform navigations if necessary.
  const router = useRouter();

  // Effect to set up the authentication state listener.
  useEffect(() => {
    console.log("🔄 Initializing AuthProvider...");
    let unsubscribeUserDoc: (() => void) | null = null;

    // Set up Firebase auth listener.
    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        console.log("🔥 Auth state changed:", firebaseUser ? `UID: ${firebaseUser.uid}` : "No user");

        // If a user is authenticated...
        if (firebaseUser) {
          setUser(firebaseUser);
          // Create a reference to the user's document in Firestore.
          const userDocRef = doc(db, "users", firebaseUser.uid);

          // Check if the Firestore document exists; if not, create it.
          getDoc(userDocRef)
            .then((snapshot) => {
              if (!snapshot.exists()) {
                console.warn("⚠️ No Firestore user data found for UID:", firebaseUser.uid);
                // Prepare a new user data object.
                const newUserData: FirestoreUser = {
                  uid: firebaseUser.uid,
                  displayName: firebaseUser.displayName || "",
                  email: firebaseUser.email || "",
                  emailVerified: firebaseUser.emailVerified,
                  photoURL: firebaseUser.photoURL || "",
                  phoneNumber: firebaseUser.phoneNumber || "",
                  workspaceName: "",
                  createdAt: new Date(),
                  lastSignInTime: firebaseUser.metadata.lastSignInTime
                    ? new Date(firebaseUser.metadata.lastSignInTime)
                    : undefined,
                };
                // Save the new user data to Firestore.
                return setDoc(userDocRef, newUserData).then(() => newUserData);
              }
              // Return existing user data.
              return snapshot.data() as FirestoreUser;
            })
            .then((data) => setUserData(data))
            .catch((error) => console.error("❌ Error initializing user document:", error));

          // Set up a real-time subscription to the user's Firestore document.
          unsubscribeUserDoc = onSnapshot(
            userDocRef,
            (snapshot) => {
              if (snapshot.exists()) {
                const data = snapshot.data() as FirestoreUser;
                console.log("✅ Firestore user data updated:", data);
                setUserData(data);
              } else {
                console.log("⚠️ Firestore snapshot empty, awaiting setDoc...");
              }
            },
            (error) => console.error("❌ Firestore subscription error:", error)
          );
        } else {
          // If no user is authenticated, clear the state.
          console.log("🚨 No authenticated user found.");
          setUser(null);
          setUserData(null);
        }

        // Once the auth state is processed, mark loading as false and initialization complete.
        setLoading(false);
        setInitialized(true);
        console.log("✔️ AuthProvider initialized:", {
          user: firebaseUser?.uid,
          loading: false,
          initialized: true,
        });
      },
      (error) => {
        console.error("❌ Auth state change error:", error);
        setLoading(false);
        setInitialized(true);
      }
    );

    // Cleanup subscriptions when the component unmounts or router changes.
    return () => {
      console.log("🧹 Cleaning up AuthProvider subscriptions...");
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, [router]);

  // Provide the auth context value to child components.
  return (
    <AuthContext.Provider value={{ user, loading, userData, initialized }}>
      {children}
    </AuthContext.Provider>
  );
};