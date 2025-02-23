import { AuthProvider,useAuth } from "@/context/AuthProvider";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import "@/styles/global.css";

const protectedRoutes = [
  "/dashboard",
  "/addlink",
  "/categories",
  "/favorites",
  "/tags",
  "/settings",
  "/userprofile",
];

function AuthWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const auth = useAuth(); // 

  if (!auth) return <div>Loading authentication...</div>; // ✅ Prevents the error

  const { user, loading, initialized } = auth;

  if (loading) return <div>Loading...</div>;

  if (initialized && protectedRoutes.includes(router.pathname) && !user) {
    router.replace("/login");
    return <div>Redirecting to login...</div>;
  }

  return <>{children}</>;
}

function PageLogger() {
  const { user, userData } = useAuth();
  console.log("📄 Page loaded - User Auth Data:", user);
  console.log("📄 Page loaded - Firestore Data:", userData);
  return null;
}

function MyApp({ Component, pageProps }: AppProps & { Component: any }) {
  const getLayout = Component.getLayout || ((page: React.ReactNode) => page);

  return (
    <AuthProvider>
      <PageLogger />
      <AuthWrapper>{getLayout(<Component {...pageProps} />)}</AuthWrapper>
    </AuthProvider>
  );
}

export default MyApp;