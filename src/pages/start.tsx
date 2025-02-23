import React, { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import { useRouter } from 'next/router';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/provider/Google/firebase';
import { useAuth } from '@/context/AuthProvider';
import { motion } from 'motion/react';

const StartPage = () => {
  const { user } = useAuth();
  const router = useRouter();
  const [workspaceName, setWorkspaceName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Set mounted to true after component mounts (client-side)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect to login if no user is authenticated once mounted
  useEffect(() => {
    if (mounted && !user) {
      router.replace('/login');
    }
  }, [mounted, user, router]);

  // Optionally, render a loader or nothing until mounted and user are available
  if (!mounted || !user) {
    return null;
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Update the user's document with the workspace name.
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(userDocRef, { workspaceName }, { merge: true });

      // Optionally, create a workspace document if it doesn't already exist.
      const workspaceDocRef = doc(db, 'workspaces', workspaceName);
      await setDoc(workspaceDocRef, {
        owner: user.uid,
        members: [user.uid],
        createdAt: serverTimestamp(),
      });

      router.replace('/dashboard');
    } catch (err) {
      console.error("❌ Error completing registration:", err);
      setError('Failed to complete registration. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left Side: Logo, Tagline & Animated Headline */}
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
                  d="M142.293 1C106.854 16.8908 6.08202 7.17705 1.23654 43.3756C-2.10604 68.3466 29.5633 73.2652 122.688 71.7518C215.814 70.2384 316.298 70.689 275.761 38.0785C230.14 1.37835 97.0503 24.4575 52.9384 1"
                  stroke="#ff6523"
                  strokeWidth="3"
                />
              </svg>
            </span>
          </h1>
        </div>
      </div>

      {/* Right Side: Complete Registration Form Container */}
      <div className="w-1/2 h-screen flex items-center justify-center">
        <div className="w-[400px] p-8 flex flex-col items-center justify-center space-y-6">
          <div className="text-left mb-4">
            <label className="block text-[4rem] text-[var(--black)] w-[400px] mx-auto">
              Get Access
            </label>
            <span className="block text-[1.5rem] w-[400px] mx-auto">
              Create your account and give in to your workspace.
            </span>
          </div>
          <form 
            onSubmit={handleSubmit} 
            className="space-y-4 flex flex-col items-center"
          >
            <input
              type="text"
              placeholder="Workspace Name"
              value={workspaceName}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setWorkspaceName(e.target.value)}
              required
              className="w-[400px] h-[4.1rem] px-4 py-3 border border-gray-300 rounded-xl bg-[var(--grey)] focus:outline-none focus:border-black"
            />
            <div className="flex w-[400px] mt-4">
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
          {error && <p className="text-red-500 text-center">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default StartPage;