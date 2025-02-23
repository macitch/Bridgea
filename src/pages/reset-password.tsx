import { useState, FormEvent, ChangeEvent } from "react";
import { sendPasswordReset, formatFirebaseError } from "../provider/Google/auth";
import { useRouter } from "next/router";
import Link from "next/link";
import { FirebaseError } from "firebase/app"; // Ensure FirebaseError is imported

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState<string>("");
  const [message, setMessage] = useState<string>(""); 
  const [error, setError] = useState<string>("");  
  const [loading, setLoading] = useState<boolean>(false); // Loading state  
  const router = useRouter();

  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true); // Start loading

    try {
      await sendPasswordReset(email);
      setMessage("Password reset email sent! Please check your inbox.");
      
      setTimeout(() => {
        router.push("/login");
      }, 5000); // Adjust delay as needed
    } catch (err) {
      let errorMessage = "An unknown error occurred.";

      // Type-safe error handling
      if (err instanceof FirebaseError) {
        errorMessage = formatFirebaseError(err); // Firebase-specific errors
      } else if (err instanceof Error) {
        errorMessage = err.message; // Generic JavaScript errors
      }

      setError(errorMessage);
      console.error("Password reset error:", err); // Optional: Log error for debugging
    } finally {
      setLoading(false); // End loading
    }
  };

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <div className="max-w-md w-full bg-[var(--seasalt)] shadow-lg p-8 rounded-lg z-10">
        <div className="flex items-center mb-6">
          <img
            src="/assets/img/logo.svg"
            alt="Bridgea Logo"
            className="w-16 h-auto mr-3"
          />
          <div>
            <h1 className="text-2xl font-bold text-[var(--night)]">Bridgea</h1>
            <p className="text-sm text-[var(--night)]-700">
              Organize Today, Discover Tomorrow.
            </p>
          </div>
        </div>

        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            <label htmlFor="email" className="sr-only">Email Address</label> {/* Accessible label */}
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={handleEmailChange}
              className="border border-gray-300 text-[var(--night)] px-3 py-2 w-full 
                         focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
              required
              disabled={loading} // Disable input when loading
            />
          </div>

          <button
            type="submit"
            className={`w-full bg-[var(--medium-slate-blue)] 
                       text-white font-semibold py-2 rounded 
                       hover:bg-[var(--medium-slate-blue-dark)] transition-colors
                       ${loading ? "cursor-not-allowed opacity-50" : ""}`} // Style changes when loading
            disabled={loading} // Disable button when loading
          >
            {loading ? "Sending..." : "Reset Password"} {/* Show loading text */}
          </button>

          {message && <p className="text-green-500 text-center mt-2">{message}</p>}
          {error && <p className="text-red-500 text-center mt-2">{error}</p>}
        </form>

        <div className="mt-6 text-center text-sm text-[var(--night)]">
          Remembered your password?{" "}
          <Link
            href="/login"
            className="text-[var(--medium-slate-blue)] hover:underline"
          >
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
