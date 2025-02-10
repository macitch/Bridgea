import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth, db } from "@/firebase/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
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

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log("🟡 Firebase onAuthStateChanged triggered", user);

      if (user) {
        setUser(user);
        console.log("✅ Firebase user detected:", user);

        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            console.log("✅ Firestore user data found:", userDoc.data());
            setUserData(userDoc.data() as FirestoreUser);
          } else {
            console.warn("⚠️ No Firestore user data found for UID:", user.uid, "— creating new user document.");
            const newUserData: FirestoreUser = {
              uid: user.uid,
              displayName: user.displayName || "",
              email: user.email || "",
              emailVerified: user.emailVerified,
              photoURL: user.photoURL || "",
              phoneNumber: user.phoneNumber || "",
              createdAt: new Date(), // or use serverTimestamp() if you prefer
              lastSignInTime: user.metadata.lastSignInTime ? new Date(user.metadata.lastSignInTime) : undefined,
              roles: ["user"],
            };
            await setDoc(userDocRef, newUserData);
            setUserData(newUserData);
          }
        } catch (error) {
          console.error("❌ Firestore fetch error:", error);
          setUserData(null);
        }
      } else {
        console.log("🚨 No authenticated user found.");
        setUser(null);
        setUserData(null);
      }

      setLoading(false);
      setInitialized(true);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, userData, initialized }}>
      {children}
    </AuthContext.Provider>
  );
};