// Import required hooks and Firebase utilities.
import { useEffect, useRef } from "react";
import { db } from "@/provider/Google/firebase";
import { collection, query, onSnapshot, where, orderBy } from "firebase/firestore";
// Import the embeddings class from LangChain using Google Generative AI.
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
// Import our custom authentication hook.
import { useAuth } from "@/context/AuthProvider";

// Initialize the embeddings instance with API key and model name.
// This instance will be used later to generate embedding vectors for text queries.
const embeddings = new GoogleGenerativeAIEmbeddings({
  apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  modelName: "embedding-001",
});

// Define the interface for the link data object retrieved from Firestore.
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

// Custom hook to synchronize links with an external database (LanceDB).
export function useLinkSync() {
  // Retrieve the authenticated user from our Auth context.
  const { user: authUser } = useAuth();
  // Ref to keep track of the last synced link IDs to avoid unnecessary re-syncs.
  const lastSyncRef = useRef<string[]>([]);

  // useEffect to set up a real-time listener for Firestore changes on links.
  useEffect(() => {
    // If no authenticated user exists, do not set up the listener.
    if (!authUser) return;

    // Create a Firestore query to fetch all links for the current user,
    // ordered by creation time in descending order.
    const linksQuery = query(
      collection(db, "links"),
      where("userId", "==", authUser.uid),
      orderBy("createdAt", "desc")
    );

    // Set up a real-time listener on the query.
    const unsubscribe = onSnapshot(linksQuery, async (snapshot) => {
      try {
        // Filter the changes to only include 'added' or 'modified' documents.
        const links = snapshot.docChanges()
          .filter(change => change.type === "added" || change.type === "modified")
          .map(change => ({
            id: change.doc.id,
            ...change.doc.data(),
            userId: authUser.uid,
          })) as LinkData[];

        // If no links are found, do nothing.
        if (links.length === 0) return;

        // Create an array of link IDs to compare with the last synced IDs.
        const newLinkIds = links.map(l => l.id);
        // If the IDs haven't changed, exit to avoid re-syncing.
        if (JSON.stringify(newLinkIds) === JSON.stringify(lastSyncRef.current)) return;
        // Update the lastSyncRef with the new link IDs.
        lastSyncRef.current = newLinkIds;

        // Retrieve the auth token needed for the sync API call.
        const token = await authUser.getIdToken();

        // Map through each link and generate an embedding for its combined text.
        const syncData = await Promise.all(links.map(async (link) => {
          // Concatenate title, description, tags, categories, and searchTerms into one string.
          const text = `${link.title || link.url} ${link.description || ""} ${link.tags?.join(" ") || ""} ${link.categories?.join(" ") || ""} ${link.searchTerms || ""}`;
          // Generate an embedding vector using the embeddings instance.
          const vector = await embeddings.embedQuery(text);
          return {
            id: link.id,
            text,
            vector,
            // Prepare metadata as a JSON string containing various link fields.
            metadata: JSON.stringify({
              url: link.url,
              title: link.title || link.url,
              description: link.description || "",
              imageUrl: link.imageUrl || "",
              categories: link.categories || [],
              tags: link.tags || [],
              isFavorite: link.isFavorite || false,
              userId: link.userId,
              // Convert Firestore timestamp to ISO string, or use the current date if not available.
              dateAdded: link.createdAt?.toDate().toISOString() || new Date().toISOString(),
            }),
          };
        }));

        // Send the generated sync data to the external service (LanceDB) with retry logic.
        const response = await syncWithRetry(authUser.uid, syncData, token);
        console.log("Links synced successfully:", await response.json());
      } catch (error) {
        console.error("Sync error:", error);
      }
    }, console.error);

    // Clean up the snapshot listener when the component unmounts or when authUser changes.
    return () => unsubscribe();
  }, [authUser]);
}

// Helper function to sync data with the external API (LanceDB) with retry logic.
async function syncWithRetry(userId: string, data: any[], token: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      // Attempt to sync the data using a POST request.
      const response = await fetch("/api/syncLanceDB", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ userId, links: data }),
      });
      // If the response is successful, return it.
      if (response.ok) return response;
      // Otherwise, throw an error with the response text.
      throw new Error(await response.text());
    } catch (error) {
      // If this is the final retry, rethrow the error.
      if (i === retries - 1) throw error;
      // Wait for an exponentially increasing delay before retrying.
      await new Promise(res => setTimeout(res, 2 ** i * 1000));
    }
  }
  throw new Error("Sync failed after all retries");
}