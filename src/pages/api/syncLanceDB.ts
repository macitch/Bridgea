import type { NextApiRequest, NextApiResponse } from "next";
import { initializeLanceDB } from "../../provider/LanceDB/lancedb";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { userId, links } = req.body;
  if (!userId || !links) return res.status(400).json({ error: "userId and links required" });

  try {
    const vectorStore = await initializeLanceDB(userId);
    await vectorStore.addVectors(
      links.map((l: any) => l.vector),
      links.map((l: any) => ({ id: l.id, pageContent: l.text, metadata: { metadata: l.metadata } }))
    );
    return res.status(200).json({ success: true, count: links.length });
  } catch (error) {
    console.error("Sync error:", error);
    return res.status(500).json({ error: "Sync failed", details: String(error) });
  }
}