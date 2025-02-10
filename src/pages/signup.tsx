import { useState, useEffect } from "react";
import { signUp } from "../firebase/auth";
import { useRouter } from "next/router";
import AnimatedBackground from "../components/UI/ShapedBackground";
import Link from "next/link";
import { FormEvent } from "react"; // Import FormEvent from React
import { getAuth, onAuthStateChanged } from "firebase/auth"; // Ensure you have the necessary imports

const SignUpPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // Handle sign-up form submission
  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await signUp(email, password, workspaceName);
      router.push("/dashboard");
    } catch (err) {
      // Type assertion for error handling
      if (err instanceof Error) {
        setError(err.message); // Display error message
      } else {
        setError("An unknown error occurred."); // Fallback error message
      }
    } finally {
      setLoading(false);
    }
  };

  // Add auth state listener to check for authenticated user
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) router.push("/dashboard");
    });
    return () => unsubscribe();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <AnimatedBackground />
      <div className="max-w-md w-full bg-background shadow-xl p-8 space-y-6 relative z-10">
        {/* Your JSX content */}
        <form onSubmit={handleSignUp} className="space-y-4">
          {/* Email, password, and workspace name fields */}
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            required
          />
          <input
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            required
          />
          <input
            type="text"
            placeholder="Enter your workspace name"
            value={workspaceName}
            onChange={(e) => setWorkspaceName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md"
            required
          />
          
          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full bg-primary text-white font-semibold py-2 ${
              loading ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            {loading ? "Creating Account..." : "Sign Up"}
          </button>
        </form>

        {/* Display error message */}
        {error && <p className="text-red-500 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default SignUpPage;
