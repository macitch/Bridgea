import { useRouter } from "next/router";
import { useAuth } from "../../context/AuthProvider";
import { useEffect } from "react";

const protectedRoutes = [
  "/dashboard",
  "/addlink",
  "/categories",
  "/favorites",
  "/tags",
  "/settings",
  "/userprofile",
];

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading, initialized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && initialized && protectedRoutes.includes(router.pathname) && !user) {
      console.warn("🚨 No user found. Redirecting to login...");
      router.replace("/login");
    }
  }, [user, loading, initialized, router]);

  if (loading || !initialized || !user) {
    return <div>Loading...</div>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;