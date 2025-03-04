import React, { useState, useEffect, ChangeEvent, FormEvent } from "react";
// Import Next.js router for navigation.
import { useRouter } from "next/router";
// Import Firestore functions to read and write documents.
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
// Import Firebase authentication functions.
import { getAuth } from "firebase/auth";
// Import the Firestore database instance.
import { db } from "@/provider/Google/firebase";
// Import the authentication context hook.
import { useAuth } from "@/context/AuthProvider";
// Import motion for animated elements.
import { motion } from "motion/react";

const StartPage = () => {
  // Get the current authenticated user from context.
  const { user } = useAuth();
  // Get the Next.js router instance for navigation.
  const router = useRouter();

  // Local state for the workspace name input.
  const [workspaceName, setWorkspaceName] = useState('');
  // Local state for error messages.
  const [error, setError] = useState('');
  // Local state for loading indicator during form submission.
  const [loading, setLoading] = useState(false);
  // Local state to track if the component has mounted (client-side only).
  const [mounted, setMounted] = useState(false);

  // On component mount, set the mounted flag to true.
  useEffect(() => {
    setMounted(true);
  }, []);

  // Once mounted, check if the user is authenticated.
  // If no user is present, redirect to the login page.
  useEffect(() => {
    if (mounted && !user) {
      router.replace('/login');
    }
  }, [mounted, user, router]);

  // If the component is not mounted yet or there's no user, render nothing.
  if (!mounted || !user) {
    return null;
  }

  // Handler for form submission to create or join a workspace.
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Clear any previous error messages.
    setError('');
    // Set the loading state to true.
    setLoading(true);

    try {
      console.log("Starting handleSubmit...");
      // Ensure the user is authenticated; throw an error if not.
      if (!user || !user.uid) {
        console.log("User check failed:", { user });
        throw new Error("User not authenticated");
      }
      console.log("User authenticated:", { uid: user.uid, email: user.email });

      // Refresh the current user's ID token.
      const auth = getAuth();
      const token = await auth.currentUser?.getIdToken(true);
      console.log("Auth token refreshed:", token ? "Token exists" : "No token");

      // Update the user's document in Firestore with the provided workspace name.
      console.log("Attempting to update user document...");
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { workspaceName }, { merge: true });
      console.log("✅ Updated user document with workspaceName:", workspaceName);

      // Check if the chosen workspace name already exists.
      console.log("Checking if workspace exists:", workspaceName);
      const workspaceDocRef = doc(db, 'workspaces', workspaceName);
      const workspaceSnap = await getDoc(workspaceDocRef);
      console.log("Workspace check result:", { exists: workspaceSnap.exists(), data: workspaceSnap.data() });
      if (workspaceSnap.exists()) {
        // If the workspace already exists, display an error message and stop loading.
        setError('Workspace name already taken. Please choose another.');
        setLoading(false);
        return;
      }

      // Create the workspace document with the current user as owner and member.
      const workspaceData = {
        owner: user.uid,
        members: [user.uid],
        createdAt: serverTimestamp(),
      };
      console.log("Attempting to create workspace with data:", workspaceData);
      await setDoc(workspaceDocRef, workspaceData);
      console.log("✅ Created workspace:", workspaceName);

      // Redirect the user to the dashboard after successful workspace creation.
      console.log("Redirecting to dashboard...");
      router.replace('/dashboard');
    } catch (err: any) {
      // Log the error details for debugging.
      console.error("❌ Error completing registration:", err);
      console.log("Error details:", { code: err.code, message: err.message, stack: err.stack });
      // Check error codes and update the error state with an appropriate message.
      if (err.code === 'permission-denied') {
        setError('Permission denied. Please check your authentication status.');
      } else {
        setError(`Failed to complete registration: ${err.message || 'Unknown error'}`);
      }
    } finally {
      // Reset the loading state after submission is complete.
      console.log("handleSubmit completed, loading set to false");
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left side: Branding section with logo and animated headline */}
      <div className="w-1/2 h-screen flex flex-col">
        <div className="p-8 flex items-center">
          <img src="/assets/logo.svg" alt="Logo" className="w-16 h-auto mr-4" />
          <div>
            <h1 className="text-2xl font-bold text-black">Bridgea</h1>
            <p className="text-sm text-gray-700">Organize Today, Discover Tomorrow.</p>
          </div>
        </div>
        <div className="flex-grow flex items-center justify-center">
          <h1 className="max-w-2xl text-center text-[64px]">
            Your space, your links,{' '}
            <span className="relative">
              organized
              <svg
                viewBox="0 0 286 73"
                fill="none"
                className="absolute -left-2 -right-2 -top-2 bottom-0 translate-y-1"
              >
                <motion.path
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  transition={{ duration: 2.5, ease: "easeInOut", repeat: Infinity }}
                  // SVG path for the animated underline effect.
                  d="M142.293 1C106.854 16.8908 6.08202 7.17705 1.23654 43.3756C-2.10604 68.3466 29.5633 73.2652 122.688 71.7518C215.814 70.2384 316.298 70.689 275.761 38.0785C230.14 1.37835 97.0503 24.4575 52.9384 1"
                  stroke="#ff6523"
                  strokeWidth="3"
                />
              </svg>
            </span>
          </h1>
        </div>
      </div>
      {/* Right side: Registration form */}
      <div className="w-1/2 h-screen flex items-center justify-center">
        <div className="w-[400px] p-8 flex flex-col items-center justify-center space-y-6">
          {/* Header and introductory text */}
          <div className="text-left mb-4">
            <label className="block text-[4rem] text-[var(--black)] w-[400px] mx-auto">
              Get Access
            </label>
            <span className="block text-[1.5rem] w-[400px] mx-auto">
              Create your account and give in to your workspace.
            </span>
          </div>
          {/* Sign-up form */}
          <form onSubmit={handleSubmit} className="space-y-4 flex flex-col items-center">
            {/* Workspace Name Input */}
            <input
              type="text"
              placeholder="Workspace Name"
              value={workspaceName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setWorkspaceName(e.target.value)}
              required
              className="w-[400px] h-[4.1rem] px-4 py-3 border border-gray-300 rounded-xl bg-[var(--grey)] focus:outline-none focus:border-black"
            />
            <div className="flex w-[400px] mt-4">
              {/* Submit button for registration */}
              <button
                type="submit"
                disabled={loading}
                className={`w-[11.5rem] h-[4.1rem] text-[var(--white)] rounded-xl font-bold bg-[var(--black)] hover:text-[var(--black)] hover:bg-[var(--orange)] ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Saving..." : "Launch"}
              </button>
            </div>
          </form>
          {/* Display an error message if registration fails */}
          {error && <p className="text-red-500 text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default StartPage;