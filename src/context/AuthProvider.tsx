import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/firebase/firebase";
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
    console.log("🔄 Checking authentication state...");
    let unsubscribeUserDoc: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setUser(user);
        console.log("✅ Firebase user detected:", user);
        const userDocRef = doc(db, "users", user.uid);
        
        // Subscribe to realtime updates for the user document.
        unsubscribeUserDoc = onSnapshot(userDocRef, (snapshot) => {
          if (snapshot.exists()) {
            console.log("✅ Firestore user data updated:", snapshot.data());
            setUserData(snapshot.data() as FirestoreUser);
          } else {
            console.warn("⚠️ No Firestore user data found for UID:", user.uid, "— creating new user document.");
            const newUserData: FirestoreUser = {
              uid: user.uid,
              displayName: user.displayName || "",
              email: user.email || "",
              emailVerified: user.emailVerified,
              photoURL: user.photoURL || "",
              phoneNumber: user.phoneNumber || "",
              workspaceName: "",
              createdAt: new Date(),
              lastSignInTime: user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : undefined,
            };
            setDoc(userDocRef, newUserData);
            setUserData(newUserData);
          }
        });
      } else {
        console.log("🚨 No authenticated user found.");
        setUser(null);
        setUserData(null);
      }
      // Important: Mark loading complete and initialization complete
      setLoading(false);
      setInitialized(true);
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeUserDoc) unsubscribeUserDoc();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, userData, initialized }}>
      {children}
    </AuthContext.Provider>
  );
};