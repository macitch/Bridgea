import React, { useState } from "react";
import SearchBar from "../UI/SearchBar";
import UserMenu from "../UI/UserMenu";
import { FirestoreUser } from "@/models/users";
import { useAuth } from "@/context/AuthProvider";
import { logout } from "@/provider/Google/auth";
import { useRouter } from "next/router";
import ChatToggleButton from "../UI/ChatToggleButton";
import ChatPanel from "../TIA/ChatPanel";
import { useLinkSync } from "@/provider/Chat/sync";
import { db } from "@/provider/Google/firebase";
import { collection, query, getDocs, where } from "firebase/firestore";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  modelName: "embedding-001",
});

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

export default function DashboardNavbar() {
  const { user: authUser, userData, loading } = useAuth();
  const router = useRouter();
  console.log("UseLinkSync Not trigered");
  useLinkSync();
  console.log("UseLinkSync trigered");

  const syncNow = async () => {
    if (!authUser) {
      console.log("No authenticated user for manual sync");
      return;
    }

    console.log("Manual sync requested for user:", authUser.uid);
    try {
      // Try /users/{userId}/links first
      let linksQuery = query(collection(db, "users", authUser.uid, "links"));
      let snapshot = await getDocs(linksQuery);
      let links = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        userId: authUser.uid,
      })) as LinkData[];

      console.log("Fetched from /users/{userId}/links:", links);

      // If no links found, try /links with userId filter
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

      const syncData = await Promise.all(
        links.map(async (link) => {
          const text = `${link.title || link.url} ${link.description || ""} ${link.tags?.join(" ") || ""} ${link.categories?.join(" ") || ""} ${link.searchTerms || ""}`;
          const vector = await embeddings.embedQuery(text);
          return {
            id: link.id,
            text,
            vector,
            metadata: JSON.stringify({
              url: link.url,
              title: link.title || link.url,
              description: link.description || "",
              imageUrl: link.imageUrl || "",
              categories: link.categories || [],
              tags: link.tags || [],
              isFavorite: link.isFavorite || false,
              userId: link.userId,
              dateAdded: link.createdAt?.toDate().toISOString() || new Date().toISOString(),
            }),
          };
        })
      );

      console.log("Sync data prepared with", syncData.length, "links");

      const token = await authUser.getIdToken();
      const response = await fetch("/api/syncLanceDB", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: authUser.uid,
          links: syncData,
          schema: syncData.length === 0 ? { vector: Array(768).fill(0), text: "", id: "", metadata: "" } : undefined,
        }),
      });

      if (!response.ok) throw new Error(`Manual sync failed: ${await response.text()}`);
      console.log("Manual sync successful:", await response.json());
    } catch (error) {
      console.error("Manual sync error:", error);
    }
  };

  const [chatOpen, setChatOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  if (loading) return <div>Loading...</div>;

  const avatarUrl = userData?.photoURL || "/assets/logo.png";
  const userForMenu: FirestoreUser = {
    displayName: userData?.displayName || "Loading",
    email: userData?.email || "Loading",
    createdAt: new Date(),
    photoURL: avatarUrl,
  };

  const handleSearch = async (value: string) => {
    setSearchTerm(value);
    if (value.trim()) {
      await syncNow(); // Sync before opening ChatPanel
      setChatOpen(true);
    }
  };

  const handleProfile = () => router.push("/profile");
  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <>
      <header className="w-full h-full flex items-center px-4 justify-between bg-[var(--white)] rounded-tl-2xl">
        <div className="flex items-center space-x-2">
          <SearchBar
            placeholder="Search via chatbot..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onSearch={handleSearch}
          />
        </div>
        <div className="flex items-center space-x-4">
          <ChatToggleButton onClick={() => setChatOpen(true)} />
          <UserMenu user={userForMenu} onProfile={handleProfile} onLogout={handleLogout} />
        </div>
      </header>
      <ChatPanel isOpen={chatOpen} onClose={() => setChatOpen(false)} user={authUser} initialMessage={searchTerm} />
    </>
  );
}