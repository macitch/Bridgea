import React from "react";
import { useRouter } from "next/router";
import { logout } from "@/provider/Google/auth";
import { useAuth } from "@/context/AuthProvider";

const IndexPage: React.FC = () => {
  const router = useRouter();
  const auth = useAuth(); // ✅ Don't destructure immediately

  if (!auth) {
    return <div>Loading authentication...</div>; // ✅ Prevents "useAuth must be used within an AuthProvider"
  }

  const { user } = auth;

  const handleLogout = async () => {
    try {
      await logout();
      router.push("/login");
    } catch (error) {
      console.error("❌ Logout failed:", error);
    }
  };

  const handleLogin = () => {
    router.push("/login");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <h1 className="text-2xl font-bold mb-6">Welcome to Bridgea</h1>
      <div className="space-x-4">
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
      {user && (
        <p className="mt-4 text-sm text-gray-700">
          You are currently logged in as {user.email}
        </p>
      )}
    </div>
  );
};

export default IndexPage;