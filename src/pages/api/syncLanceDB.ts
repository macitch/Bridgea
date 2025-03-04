import type { NextApiRequest, NextApiResponse } from "next";
// Import the function to initialize the LanceDB vector store for a user.
import { initializeLanceDB } from "../../provider/LanceDB/lancedb";

// API route handler to add vectors to the LanceDB vector store.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests. Return a 405 error if the method is not POST.
  if (req.method !== "POST") 
    return res.status(405).json({ error: "Method not allowed" });

  // Extract userId and links from the request body.
  const { userId, links } = req.body;
  // Validate that both userId and links are provided; otherwise, return a 400 error.
  if (!userId || !links)
    return res.status(400).json({ error: "userId and links required" });

  try {
    // Initialize the LanceDB vector store for the given user.
    const vectorStore = await initializeLanceDB(userId);
    
    // Add vectors to the vector store.
    // The first argument is an array of vectors extracted from each link.
    // The second argument is an array of corresponding metadata objects.
    await vectorStore.addVectors(
      links.map((l: any) => l.vector),
      links.map((l: any) => ({ 
        id: l.id, 
        pageContent: l.text, 
        metadata: { metadata: l.metadata } 
      }))
    );

    // Return a success response including the number of links processed.
    return res.status(200).json({ success: true, count: links.length });
  } catch (error) {
    // Log any errors encountered during the sync process.
    console.error("Sync error:", error);
    // Return a 500 error response with error details.
    return res.status(500).json({ error: "Sync failed", details: String(error) });
  }
}