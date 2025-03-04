// Import AuthProvider and useAuth hook to manage authentication context.
import { AuthProvider, useAuth } from "@/context/AuthProvider";
// Import AppProps type for Next.js app component.
import type { AppProps } from "next/app";
// Import Next.js router for navigation purposes.
import { useRouter } from "next/router";
// Import React and useEffect hook.
import React, { useEffect } from "react";
// Import global CSS styles.
import "@/styles/global.css";

// Define an array of routes that require the user to be authenticated.
const protectedRoutes = [
  "/dashboard",
  "/addlink",
  "/categories",
  "/favorites",
  "/tags",
  "/settings",
  "/userprofile",
];

// Define an array of public routes that unauthenticated users can access.
const publicRoutes = ["/login", "/signup"];

/**
 * AuthWrapper Component
 *
 * Wraps the application to handle redirection based on the user's authentication state.
 * - If a protected route is accessed without authentication, the user is redirected to "/login".
 * - If an authenticated user accesses a public route, they are redirected to "/dashboard".
 */
function AuthWrapper({ children }: { children: React.ReactNode }) {
  // Get the router instance to perform navigation.
  const router = useRouter();
  // Retrieve authentication state from the Auth context.
  const auth = useAuth();

  // If authentication state is not yet ready or is loading, show a loading message.
  if (!auth || auth.loading) {
    return <div>Loading authentication...</div>;
  }

  // Destructure the user and initialization flag from the auth context.
  const { user, initialized } = auth;

  // useEffect to handle redirection once authentication has been initialized.
  useEffect(() => {
    if (initialized) {
      // Determine if the current route is a public route.
      const isPublicRoute = publicRoutes.some((path) =>
        router.pathname.startsWith(path)
      );
      // Determine if the current route is protected.
      const isProtectedRoute = protectedRoutes.includes(router.pathname);

      // If there is no authenticated user and the route is protected, redirect to "/login".
      if (!user && isProtectedRoute) {
        router.replace("/login");
      }
      // If there is an authenticated user and they are accessing a public route, redirect to "/dashboard".
      if (user && isPublicRoute) {
        router.replace("/dashboard");
      }
    }
  }, [user, initialized, router]);

  // Render the child components if no redirection is triggered.
  return <>{children}</>;
}

/**
 * MyApp Component
 *
 * The main Next.js app component that wraps the entire application.
 * It provides the AuthProvider and uses the AuthWrapper to handle authentication-based routing.
 */
function MyApp({ Component, pageProps }: AppProps & { Component: any }) {
  // Use a layout function from the page component if available.
  const getLayout = Component.getLayout || ((page: React.ReactNode) => page);
  return (
    // Wrap the application with AuthProvider to provide authentication context.
    <AuthProvider>
      {/* AuthWrapper handles redirection based on auth state. */}
      <AuthWrapper>{getLayout(<Component {...pageProps} />)}</AuthWrapper>
    </AuthProvider>
  );
}

export default MyApp;