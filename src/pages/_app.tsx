import type { AppProps } from "next/app";
import { AuthProvider, useAuth } from "@/context/AuthProvider";
import ProtectedRoute from "@/components/Shared/ProtectedRoute";
import "@/styles/global.css"; 

function MyApp({ Component, pageProps }: AppProps & { Component: any }) {
  const getLayout = Component.getLayout || ((page: React.ReactNode) => page);



  return (
    <AuthProvider>
      <PageLogger />
      {getLayout(<Component {...pageProps} />)}
    </AuthProvider>
  );
}

export default MyApp;


function PageLogger() {
  const { user, userData } = useAuth();
  console.log("📄 Page loaded - User Auth Data:", user);
  console.log("📄 Page loaded - Firestore Data:", userData);
  return null;
}