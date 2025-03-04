import { initializeApp } from "firebase/app";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Firebase configuration object populated with environment variables.
// This configuration is used to initialize your Firebase app.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Initialize the Firebase app with the provided configuration.
const app = initializeApp(firebaseConfig);

// Initialize Firestore and export it for use in your application.
export const db = getFirestore(app);

// Initialize Firebase Auth.
const auth = getAuth();
// Set authentication persistence to browserLocalPersistence so that the user session
// persists across browser refreshes. Log success or error accordingly.
setPersistence(auth, browserLocalPersistence)
  .then(() => console.log("✅ Firebase auth persistence enabled"))
  .catch((error) => console.error("❌ Error setting auth persistence:", error));

// Export the auth instance for use throughout your app.
export { auth };