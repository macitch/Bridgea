import React, { useState, useEffect, FormEvent } from "react";
// Import Next.js router for page navigation.
import { useRouter } from "next/router";
// Import Firebase auth functions to monitor authentication state.
import { getAuth, onAuthStateChanged } from "firebase/auth";
// Import the custom signUp function that handles account creation.
import { signUp } from "@/provider/Google/auth";
// Import motion for any animated elements.
import { motion } from "motion/react";

const SignUpPage = () => {
  // Local state to store user credentials and workspace information.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  
  // State for error messages and loading indicator.
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  
  // Get the Next.js router instance to perform redirections.
  const router = useRouter();

  // Set up an effect to redirect authenticated users away from the sign-up page.
  // This prevents users who are already logged in from accessing this page.
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // If the user is authenticated, redirect to the dashboard.
        router.replace("/dashboard");
      }
    });
    // Clean up the subscription when the component unmounts.
    return () => unsubscribe();
  }, [router]);

  // Handler for form submission to sign up a new user.
  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Clear previous errors and set loading state.
    setLoading(true);
    setError("");
    try {
      // Call the signUp function with the provided credentials and workspace name.
      await signUp(email, password, displayName, workspaceName);
      // On successful account creation, redirect to the dashboard.
      router.push("/dashboard");
    } catch (err) {
      // If an error occurs, update the error state accordingly.
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      // End the loading state once the process is complete.
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left side: Branding area containing the logo, name, and animated headline */}
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
            Your space, your links,{" "}
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
                  transition={{
                    duration: 2.5,
                    ease: "easeInOut",
                    repeat: 9999,
                  }}
                  // Animated underline effect for the headline.
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
        <div className="w-full h-full p-8 space-y-6">
          {/* Header text for the registration form */}
          <div className="text-center mb-4">
            <label className="block text-[4rem] text-[var(--black)] w-[400px] mx-auto">
              Get Access
            </label>
            <span className="block text-[1.5rem] w-[400px] mx-auto">
              Create your account and give in to your workspace.
            </span>
          </div>
          {/* Sign-up form */}
          <form onSubmit={handleSignUp} className="space-y-4 flex flex-col items-center">
            {/* Input for full name */}
            <input
              type="text"
              placeholder="Enter your first and last name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              className="w-[400px] h-[4.1rem] px-4 py-3 border border-gray-300 rounded-xl bg-[var(--grey)] focus:outline-none focus:border-black"
            />
            {/* Input for email */}
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-[400px] h-[4.1rem] px-4 py-3 border border-gray-300 rounded-xl bg-[var(--grey)] focus:outline-none focus:border-black"
            />
            {/* Input for password */}
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-[400px] h-[4.1rem] px-4 py-3 border border-gray-300 rounded-xl bg-[var(--grey)] focus:outline-none focus:border-black"
            />
            {/* Input for workspace name */}
            <input
              type="text"
              placeholder="Enter your workspace name"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              required
              className="w-[400px] h-[4.1rem] px-4 py-3 border border-gray-300 rounded-xl bg-[var(--grey)] focus:outline-none focus:border-black"
            />
            <div className="flex w-[400px] mt-4">
              {/* Submit button for registration */}
              <button
                type="submit"
                disabled={loading}
                className={`flex-[3] h-[4.1rem] text-[var(--white)] rounded-xl font-bold bg-black hover:text-[var(--black)] hover:bg-[var(--orange)] ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              >
                {loading ? "Creating Account..." : "Sign Up"}
              </button>
              <div className="w-px bg-gray-300 mx-4"></div>
              {/* Placeholder area for potential social login buttons */}
              <div className="flex flex-[3] space-x-2">
                {/* Social login buttons can be added here */}
              </div>
            </div>
          </form>
          {/* Display error messages if registration fails */}
          {error && <p className="text-red-500 text-center">{error}</p>}
          {/* Link for existing users to navigate to the login page */}
          <div className="text-center text-sm text-black">
            Already have an account?{" "}
            <a href="/login" className="text-[var(--orange)] hover:underline">
              Log In
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignUpPage;