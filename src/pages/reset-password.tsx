import React, { useState, FormEvent, ChangeEvent } from "react";
// Import Next.js router for navigation.
import { useRouter } from "next/router";
// Import functions for sending password reset emails and formatting Firebase errors.
import { sendPasswordReset, formatFirebaseError } from "../provider/Google/auth";
// Import Link component for navigation.
import Link from "next/link";
// Import FirebaseError type for type-safe error handling.
import { FirebaseError } from "firebase/app";

const ForgotPasswordPage: React.FC = () => {
  // Local state to store the email input.
  const [email, setEmail] = useState<string>("");
  // Local state for success message.
  const [message, setMessage] = useState<string>(""); 
  // Local state for error messages.
  const [error, setError] = useState<string>("");
  // Local state to indicate whether the reset process is loading.
  const [loading, setLoading] = useState<boolean>(false);
  // Get router instance for navigation.
  const router = useRouter();

  // Handler for form submission to reset password.
  const handleResetPassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Clear previous error and success messages.
    setError("");
    setMessage("");

    // Validate email format using a simple regex.
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Set loading state to true to indicate processing.
    setLoading(true);

    try {
      // Attempt to send a password reset email using the provided email address.
      await sendPasswordReset(email);
      // On success, show a confirmation message.
      setMessage("Password reset email sent! Please check your inbox.");
      
      // After a delay (5 seconds), redirect the user to the login page.
      setTimeout(() => {
        router.push("/login");
      }, 5000); // Adjust delay as needed
    } catch (err) {
      // Default error message.
      let errorMessage = "An unknown error occurred.";

      // Handle Firebase-specific errors.
      if (err instanceof FirebaseError) {
        errorMessage = formatFirebaseError(err);
      } else if (err instanceof Error) {
        // Handle generic JavaScript errors.
        errorMessage = err.message;
      }

      // Update error state with the error message.
      setError(errorMessage);
      console.error("Password reset error:", err);
    } finally {
      // Reset the loading state.
      setLoading(false);
    }
  };

  // Handler for changes to the email input field.
  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  return (
    // Main container with full-screen height, centered content, and padding.
    <div className="h-screen flex items-center justify-center p-4 relative">
      <div className="max-w-md w-full bg-[var(--seasalt)] shadow-lg p-8 rounded-lg z-10">
        {/* Branding section with logo and tagline */}
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

        {/* Password reset form */}
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div>
            {/* Accessible label is hidden visually using sr-only class */}
            <label htmlFor="email" className="sr-only">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              placeholder="Enter your email"
              value={email}
              onChange={handleEmailChange}
              className="border border-gray-300 text-[var(--night)] px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-400 rounded"
              required
              disabled={loading} // Disable input while loading
            />
          </div>

          {/* Submit button to trigger password reset */}
          <button
            type="submit"
            className={`w-full bg-[var(--medium-slate-blue)] text-white font-semibold py-2 rounded hover:bg-[var(--medium-slate-blue-dark)] transition-colors ${loading ? "cursor-not-allowed opacity-50" : ""}`}
            disabled={loading} // Disable button when loading
          >
            {loading ? "Sending..." : "Reset Password"}
          </button>

          {/* Display a success message if one exists */}
          {message && <p className="text-green-500 text-center mt-2">{message}</p>}
          {/* Display an error message if one exists */}
          {error && <p className="text-red-500 text-center mt-2">{error}</p>}
        </form>

        {/* Link to navigate back to the login page */}
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