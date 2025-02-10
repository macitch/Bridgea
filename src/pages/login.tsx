// pages/login.tsx
import React, { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/router";
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
import dynamic from "next/dynamic";
import Link from "next/link";
import { useAuth } from "@/context/AuthProvider"; // Ensure the correct import

// Optionally disable SSR for the background if needed
const AnimatedBackground = dynamic(
  () => import("../components/UI/ShapedBackground"),
  { ssr: false }
);

const LoginPage = () => {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [rememberMe, setRememberMe] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  
  const router = useRouter();
  const auth = getAuth();
  const { user } = useAuth(); // Get authenticated user from context

  // Redirect authenticated users to the dashboard
  React.useEffect(() => {
    if (user) {
      console.log("✅ User already logged in. Redirecting to /dashboard...");
      router.replace("/dashboard");
    }
  }, [user, router]);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("🔄 Login button pressed with Email:", email);
    setError(""); // Clear previous errors
    setLoading(true);

    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;

    try {
      console.log("⚙️ Setting persistence...");
      await setPersistence(auth, persistence);
      console.log("✅ Persistence set successfully.");

      console.log("🔑 Signing in user...");
      await signInWithEmailAndPassword(auth, email, password);
      console.log("✅ Sign in successful! Redirecting to /dashboard...");

      router.push("/dashboard"); 
    } catch (err) {
      const firebaseError = err as AuthError;
      console.error("❌ Error during sign in:", firebaseError);
      setError(firebaseError.message || "An error occurred, please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      console.log("🔄 Initiating Google Sign-In...");
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      console.log("✅ Google Sign-In successful! Redirecting to /dashboard...");

      router.push("/dashboard");
    } catch (err) {
      const firebaseError = err as AuthError;
      console.error("❌ Google Sign-In failed:", firebaseError);
      setError(firebaseError.message || "Google Sign-In failed.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AnimatedBackground />
      <div className="max-w-md w-full bg-[var(--white)] shadow-xl p-8 space-y-6 relative z-10">
        {/* Logo + Title */}
        <div className="flex items-center mb-4">
          <img src="/assets/logo.svg" alt="Logo" className="w-16 h-auto mr-3" />
          <div>
            <h1 className="text-2xl font-bold text-[var(--night)]">Bridgea</h1>
            <p className="text-sm text-[var(--night)]-700">
              Organize Today, Discover Tomorrow.
            </p>
          </div>
        </div>
        {/* Login Options */}
        <div className="space-y-4">
          {/* Email/Password Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email Field */}
            <div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
                className="border border-gray-300 text-[var(--night)] px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            {/* Password Field */}
            <div>
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
                className="border border-gray-300 text-[var(--night)] px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400"
                required
              />
            </div>
            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setRememberMe(e.target.checked)}
                  className="border-gray-300 text-[var(--night)] focus:ring-indigo-500"
                />
                <span className="ml-2 text-sm text-[var(--night)]">Remember me</span>
              </label>
              {/* Corrected Forgot Password Link */}
              <Link href="/reset-password" className="text-sm text-[var(--night)] hover:text-indigo-500">
                Forgot password?
              </Link>
            </div>
            {/* Login Button */}
            <button
              type="submit"
              className="w-full bg-[var(--medium-slate-blue)] text-white font-semibold py-2"
              disabled={loading}
            >
              {loading ? "Logging in..." : "Login"}
            </button>
            {/* Error Message */}
            {error && <p className="text-red-500">{error}</p>}
          </form>
          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className="w-full bg-red-500 text-white font-semibold py-2 flex justify-center items-center"
          >
            <img src="/assets/google-icon.svg" alt="Google" className="w-5 h-5 mr-2" />
            Sign in with Google
          </button>
        </div>
        {/* Sign Up Link */}
        <div className="mt-6 text-center text-sm text-[var(--night)]">
          Don’t have an account?{" "}
          <Link href="/signup" className="text-[var(--medium-slate-blue)] hover:underline">
            Sign Up
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;