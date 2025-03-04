import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/provider/Google/firebase";
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/router";
import { FirestoreUser } from "@/models/users";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userData: FirestoreUser | null;
  initialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<FirestoreUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const router = useRouter();

  useEffect(() => {
    console.log("🔄 Initializing AuthProvider...");
    let unsubscribeUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      console.log("🔥 Auth state changed:", firebaseUser ? `UID: ${firebaseUser.uid}` : "No user");

      if (firebaseUser) {
        setUser(firebaseUser);
        const userDocRef = doc(db, "users", firebaseUser.uid);

        // Check Firestore document existence first (optional optimization)
        getDoc(userDocRef).then((snapshot) => {
          if (!snapshot.exists()) {
            console.warn("⚠️ No Firestore user data found for UID:", firebaseUser.uid, "— creating new user document.");
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
            setDoc(userDocRef, newUserData).catch((error) =>
              console.error("❌ Failed to create user document:", error)
            );
            setUserData(newUserData);
          }
        }).catch((error) => console.error("❌ Error checking Firestore user doc:", error));

        // Real-time subscription
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
          (error) => {
            console.error("❌ Firestore subscription error:", error);
          }
        );
      } else {
        console.log("🚨 No authenticated user found.");
        setUser(null);
        setUserData(null);
        if (router.pathname !== "/login") {
          console.log("➡️ Redirecting to login...");
          router.push("/login");
        }
      }

      setLoading(false);
      setInitialized(true);
      console.log("✔️ AuthProvider initialized:", { user: firebaseUser?.uid, loading: false, initialized: true });
    }, (error) => {
      console.error("❌ Auth state change error:", error);
      setLoading(false);
      setInitialized(true);
    });

    return () => {
      console.log("🧹 Cleaning up AuthProvider subscriptions...");
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, [router]); // Added router to dependencies for redirect logic

  return (
    <AuthContext.Provider value={{ user, loading, userData, initialized }}>
      {children}
    </AuthContext.Provider>
  );
};