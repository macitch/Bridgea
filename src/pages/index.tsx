import React from "react";
// Import Next.js router to navigate between pages.
import { useRouter } from "next/router";
// Import the logout function to sign out the user.
import { logout } from "@/provider/Google/auth";
// Import the authentication hook to access the current auth state.
import { useAuth } from "@/context/AuthProvider";

// IndexPage component: Displays a welcome screen with Login/Logout options.
const IndexPage: React.FC = () => {
  // Get the router instance to perform navigations.
  const router = useRouter();
  // Get authentication context; we do not destructure immediately to avoid errors.
  const auth = useAuth();

  // If auth context is not available, render a loading message.
  if (!auth) {
    return <div>Loading authentication...</div>;
  }

  // Destructure the current user from auth context.
  const { user } = auth;

  // Handler function to log out the user.
  const handleLogout = async () => {
    try {
      await logout();
      // After successful logout, navigate to the login page.
      router.push("/login");
    } catch (error) {
      console.error("❌ Logout failed:", error);
    }
  };

  // Handler function to navigate to the login page.
  const handleLogin = () => {
    router.push("/login");
  };

  return (
    // Main container: full-screen view with centered content.
    <div className="h-screen flex flex-col items-center justify-center bg-gray-100">
      {/* Welcome header */}
      <h1 className="text-2xl font-bold mb-6">Welcome to Bridgea</h1>
      <div className="space-x-4">
        {/* Conditionally render Login or Logout button based on authentication status */}
        {user ? (
          <button
            onClick={handleLogout}
            className="px-6 py-3 text-[var(--white)] rounded hover:bg-red-600 transition-colors"
          >
            Logout
          </button>
        ) : (
          <button
            onClick={handleLogin}
            className="px-6 py-3 bg-blue-500 text-[var(--white)] rounded hover:bg-blue-600 transition-colors"
          >
            Login
          </button>
        )}
      </div>
      {/* If user is logged in, display the user's email address */}
      {user && (
        <p className="mt-4 text-sm text-gray-700">
          You are currently logged in as {user.email}
        </p>
      )}
    </div>
  );
};

export default IndexPage;