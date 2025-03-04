import React, { useState, ChangeEvent, FormEvent, useEffect } from "react";
// Import Next.js router for navigation.
import { useRouter } from "next/router";
// Import Firebase authentication methods.
import { 
  getAuth, 
  setPersistence, 
  browserLocalPersistence, 
  browserSessionPersistence, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider,
  AuthError 
} from "firebase/auth";
// Import Next.js Link component for navigation.
import Link from "next/link";
// Import the custom authentication hook to access auth state.
import { useAuth } from "@/context/AuthProvider"; 
// Import motion for animations.
import { motion } from "motion/react";

const LoginPage = () => {
  // Local state for the email and password fields.
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  // Local state for the "Remember me" checkbox.
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  // Local state for error messages.
  const [error, setError] = useState<string>("");
  // Local state to indicate if a login operation is in progress.
  const [loading, setLoading] = useState<boolean>(false);
  
  // Get Next.js router instance for navigation.
  const router = useRouter();
  // Get Firebase auth instance.
  const auth = getAuth();
  // Retrieve the current user from our auth context.
  const { user } = useAuth(); 

  // (Optional) Redirect the user to the dashboard if already logged in.
  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
    }
  }, [user, router]);

  // Handler for form submission to log in the user.
  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Reset error state.
    setError("");
    // Indicate loading state.
    setLoading(true);

    // Set the persistence type based on the "Remember me" option.
    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;

    try {
      // Set the desired persistence for the authentication session.
      await setPersistence(auth, persistence);
      // Attempt to sign in with email and password.
      await signInWithEmailAndPassword(auth, email, password);
      // On success, redirection is handled by the global auth wrapper.
    } catch (err) {
      // Cast error as AuthError to extract the message.
      const firebaseError = err as AuthError;
      // Set the error message.
      setError(firebaseError.message || "An error occurred, please try again.");
    } finally {
      // Clear the loading state.
      setLoading(false);
    }
  };

  // Handler for logging in using Google Sign-In.
  const handleGoogleLogin = async () => {
    try {
      // Create a new GoogleAuthProvider instance.
      const provider = new GoogleAuthProvider();
      // Attempt to sign in with Google using a popup.
      await signInWithPopup(auth, provider);
    } catch (err) {
      // Cast error as AuthError and set the error message.
      const firebaseError = err as AuthError;
      setError(firebaseError.message || "Google Sign-In failed.");
    }
  };

  return (
    <div className="flex h-screen">
      {/* Left side: Branding and headline */}
      <div className="w-1/2 h-screen flex flex-col">
        {/* Logo and tagline */}
        <div className="p-8 flex items-center">
          <img src="/assets/logo.svg" alt="Logo" className="w-16 h-auto mr-4" />
          <div>
            <h1 className="text-2xl font-bold text-black">Bridgea</h1>
            <p className="text-sm text-gray-700">Organize Today, Discover Tomorrow.</p>
          </div>
        </div>
        {/* Animated headline area */}
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
                  // SVG path for an animated underline effect.
                  d="M142.293 1C106.854 16.8908 6.08202 7.17705 1.23654 43.3756C-2.10604 68.3466 29.5633 73.2652 122.688 71.7518C215.814 70.2384 316.298 70.689 275.761 38.0785C230.14 1.37835 97.0503 24.4575 52.9384 1"
                  stroke="#ff6523"
                  strokeWidth="3"
                />
              </svg>
            </span>
          </h1>
        </div>
      </div>

      {/* Right side: Login form */}
      <div className="w-1/2 h-screen flex items-center justify-center">
        <div>
          {/* Greeting and introduction */}
          <div className="text-left mb-4">
            <label className="block text-[4rem] text-black">Hello Again!</label>
            <span className="block text-[1.5rem] w-[400px]">
              Sign in to continue your journey and effortlessly manage your links.
            </span>
          </div>
          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-4 flex flex-col items-center">
            {/* Email input field */}
            <div>
              <input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                className="w-[400px] h-[4.1rem] px-4 py-3 border border-gray-300 rounded-xl bg-[var(--grey)] focus:outline-none focus:border-black"
                required
              />
            </div>
            {/* Password input field */}
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                className="w-[400px] h-[4.1rem] px-4 py-3 border border-gray-300 rounded-xl bg-[var(--grey)] focus:outline-none focus:border-black"
                required
              />
            </div>
            {/* Remember me checkbox and forgot password link */}
            <div className="flex items-center justify-between w-[400px]">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setRememberMe(e.target.checked)}
                  className="border-gray-300 text-black focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-black">Remember me</span>
              </label>
              <Link href="/reset-password" className="text-sm text-black hover:text-indigo-500">
                Forgot password?
              </Link>
            </div>
            {/* Row containing the login button and social login options */}
            <div className="flex w-[400px] mt-4">
              <button
                type="submit"
                className="flex-[3] h-[4.1rem] text-white rounded-xl font-bold bg-black hover:text-black hover:bg-[var(--orange)]"
              >
                Login
              </button>
              <div className="w-px bg-gray-300 mx-4"></div>
              <div className="flex flex-[3] space-x-2">
                {/* Google sign-in button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  className="group flex-1 h-[4.1rem] flex justify-center items-center"
                >
                  {/* Google icon rendered via SVG */}
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="32" 
                    height="32" 
                    viewBox="0 0 32 32" 
                    fill="currentColor"
                    className="transition-colors duration-200 group-hover:text-[var(--orange)]"
                  >
                    <path d="M29.44,16.318c0-.993-.089-1.947-.255-2.864h-13.185v5.422h7.535c-.331,1.744-1.324,3.22-2.813,4.213v3.525h4.544c2.647-2.444,4.175-6.033,4.175-10.296Z" opacity=".4"></path>
                    <path d="M16,30c3.78,0,6.949-1.247,9.265-3.385l-4.544-3.525c-1.247,.84-2.838,1.349-4.722,1.349-3.64,0-6.733-2.456-7.84-5.765l-2.717,2.09-1.941,1.525c2.304,4.569,7.025,7.713,12.498,7.713Z"></path>
                    <path d="M8.16,18.66c-.28-.84-.445-1.731-.445-2.66s.165-1.82,.445-2.66v-3.615H3.502c-.955,1.884-1.502,4.009-1.502,6.275s.547,4.391,1.502,6.275h3.332s1.327-3.615,1.327-3.615Z" opacity=".4"></path>
                    <path d="M16,7.575c2.062,0,3.895,.713,5.358,2.087l4.009-4.009c-2.431-2.265-5.587-3.653-9.367-3.653-5.473,0-10.195,3.144-12.498,7.725l4.658,3.615c1.107-3.309,4.2-5.765,7.84-5.765Z"></path>
                  </svg>
                </button>
                {/* Additional social login buttons can be added here */}
              </div>
            </div>
            {/* Display error messages if any */}
            {error && <p className="text-red-500 text-center mt-2">{error}</p>}
          </form>
          {/* Link to navigate to the Sign Up page */}
          <div className="mt-6 text-center text-sm text-black">
            Don’t have an account?{" "}
            <Link href="/signup" className="text-[var(--orange)] hover:underline">
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;