// Import necessary React hooks and components.
import React, { useState } from "react";
// Import custom UI components: a search bar and user menu.
import SearchBar from "../UI/SearchBar";
import UserMenu from "../UI/UserMenu";
// Import the FirestoreUser interface for type-checking the user data.
import { FirestoreUser } from "@/models/users";
// Import our authentication hook to access auth state.
import { useAuth } from "@/context/AuthProvider";
// Import the logout function for signing out.
import { logout } from "@/provider/Google/auth";
// Import Next.js router for navigation.
import { useRouter } from "next/router";
// Import custom components for toggling and displaying chat.
import ChatToggleButton from "../UI/ChatToggleButton";
import ChatPanel from "../TIA/ChatPanel";
// Import a hook that synchronizes links with an external vector store.
import { useLinkSync } from "@/provider/Chat/sync";
// Import Firestore functions and db instance for fetching data.
import { db } from "@/provider/Google/firebase";
import { collection, query, getDocs, where } from "firebase/firestore";
// Import the embeddings utility from LangChain (Google Generative AI).
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

// Initialize the embeddings instance with API key and model name.
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  modelName: "embedding-001",
});

// Define the LinkData interface to type-check link objects.
interface LinkData {
  id: string;
  url: string;
  title?: string;
  description?: string;
  imageUrl?: string;
  categories: string[];
  tags: string[];
  isFavorite: boolean;
  userId: string;
  createdAt: any;
  searchTerms?: string;
}

// DashboardNavbar component definition.
export default function DashboardNavbar() {
  // Retrieve authentication state, including user, userData, and loading flag.
  const { user: authUser, userData, loading } = useAuth();
  // Initialize Next.js router for navigation.
  const router = useRouter();

  // Log statements for debugging the sync hook trigger.
  console.log("UseLinkSync Not triggered");
  // Call the custom hook to synchronize link data.
  useLinkSync();
  console.log("UseLinkSync triggered");

  // Function to perform a manual synchronization of links.
  const syncNow = async () => {
    // If no authenticated user, log and exit.
    if (!authUser) {
      console.log("No authenticated user for manual sync");
      return;
    }

    console.log("Manual sync requested for user:", authUser.uid);
    try {
      // First, attempt to fetch links from the nested collection /users/{userId}/links.
      let linksQuery = query(collection(db, "users", authUser.uid, "links"));
      let snapshot = await getDocs(linksQuery);
      // Map Firestore docs to LinkData objects.
      let links = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        userId: authUser.uid,
      })) as LinkData[];

      console.log("Fetched from /users/{userId}/links:", links);

      // If no links found, try querying the top-level /links collection with a userId filter.
      if (links.length === 0) {
        console.log("No links in /users/{userId}/links, trying /links...");
        linksQuery = query(collection(db, "links"), where("userId", "==", authUser.uid));
        snapshot = await getDocs(linksQuery);
        links = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          userId: authUser.uid,
        })) as LinkData[];
        console.log("Fetched from /links:", links);
      }

      if (links.length === 0) {
        console.log("No links found in either collection");
      }

      // Prepare sync data by mapping through each link to compute embeddings and metadata.
      const syncData = await Promise.all(
        links.map(async (link) => {
          // Concatenate text fields to create a full string for embedding.
          const text = `${link.title || link.url} ${link.description || ""} ${link.tags?.join(" ") || ""} ${link.categories?.join(" ") || ""} ${link.searchTerms || ""}`;
          // Generate an embedding vector for the text.
          const vector = await embeddings.embedQuery(text);
          return {
            id: link.id,
            text,
            vector,
            // Convert link metadata to a JSON string.
            metadata: JSON.stringify({
              url: link.url,
              title: link.title || link.url,
              description: link.description || "",
              imageUrl: link.imageUrl || "",
              categories: link.categories || [],
              tags: link.tags || [],
              isFavorite: link.isFavorite || false,
              userId: link.userId,
              // Convert Firestore timestamp to ISO string; if missing, use current date.
              dateAdded: link.createdAt?.toDate().toISOString() || new Date().toISOString(),
            }),
          };
        })
      );

      console.log("Sync data prepared with", syncData.length, "links");

      // Get the auth token for authorization in the sync API call.
      const token = await authUser.getIdToken();
      // Call the sync API endpoint with the prepared data.
      const response = await fetch("/api/syncLanceDB", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: authUser.uid,
          links: syncData,
          // Provide a schema if no syncData exists.
          schema: syncData.length === 0 ? { vector: Array(768).fill(0), text: "", id: "", metadata: "" } : undefined,
        }),
      });

      // If the response is not ok, throw an error.
      if (!response.ok) throw new Error(`Manual sync failed: ${await response.text()}`);
      console.log("Manual sync successful:", await response.json());
    } catch (error) {
      console.error("Manual sync error:", error);
    }
  };

  // Local state for controlling the chat panel open state and search term.
  const [chatOpen, setChatOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // If authentication state is still loading, show a loading message.
  if (loading) return <div>Loading...</div>;

  // Determine the user's avatar URL; fallback to a default logo.
  const avatarUrl = userData?.photoURL || "/assets/logo.png";
  // Construct a FirestoreUser object for the UserMenu component.
  const userForMenu: FirestoreUser = {
    displayName: userData?.displayName || "Loading",
    email: userData?.email || "Loading",
    createdAt: new Date(),
    photoURL: avatarUrl,
  };

  // Handle search action: update the search term, trigger a manual sync, and open the chat panel.
  const handleSearch = async (value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      await syncNow(); // Perform manual sync before opening chat
      setChatOpen(true);
    }
  };

  // Navigate to the profile page.
  const handleProfile = () => router.push("/profile");
  // Handle user logout and redirect to the login page.
  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <>
      {/* Navbar header */}
      <header className="w-full h-full flex items-center px-4 bg-[var(--white)] rounded-tl-2xl">
        {/* Left side: Reserved for SearchBar or other content */}
        <div className="flex-1">
          {/* Uncomment to include SearchBar */}
          {/* <SearchBar
            placeholder="Search via chatbot..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={handleSearch}
          /> */}
        </div>

        {/* Right side: Chat toggle and user menu */}
        <div className="flex items-center space-x-4">
          <ChatToggleButton onClick={() => setChatOpen(true)} />
          <UserMenu user={userForMenu} onProfile={handleProfile} onLogout={handleLogout} />
        </div>
      </header>
      {/* Render the ChatPanel */}
      <ChatPanel
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        user={authUser}
        initialMessage={searchTerm}
      />
    </>
  );
}