import type { NextApiRequest, NextApiResponse } from "next";
import { initializeLanceDB } from "../../provider/LanceDB/lancedb";
import { parse } from "qs";
import NodeCache from "node-cache";

const cache = new NodeCache({ stdTTL: 300 }); // 5-min TTL

interface FilteredDoc {
  doc: any;
  metadata: any;
  score: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message, sessionId, k = 20, offset = 0, limit = 10 } = req.body; // Increased default k
  if (!message || !sessionId) return res.status(400).json({ error: "Message and sessionId are required" });

  const cacheKey = `${sessionId}:${message}:${k}:${offset}:${limit}`;
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) return res.status(200).json(cachedResult);

  try {
    const vectorStore = await initializeLanceDB(sessionId);
    const retriever = vectorStore.asRetriever({ k });
    const docs = await retriever.getRelevantDocuments(message);
    console.log("Initial docs from LanceDB:", docs.length); // Debug initial fetch

    const queryParams = parse(message.toLowerCase(), { delimiter: /\s+/ });
    const filters = {
      category: queryParams.category,
      tag: queryParams.tag || queryParams.tags,
      title: queryParams.title,
      description: queryParams.description,
      date: queryParams.date || queryParams.month,
    };
    const keywords: string[] = message.toLowerCase().split(/\s+/).filter((w: string) => !Object.keys(filters).includes(w));
    const hasFilters = Object.values(filters).some(value => value !== undefined);

    const filteredDocs = docs
      .map((doc: any) => {
        const metadata = parseMetadata(doc);
        const text = `${metadata.title || ""} ${metadata.description || ""} ${metadata.tags?.join(" ") || ""} ${metadata.url || ""}`.toLowerCase();
        const score = keywords.reduce((s: number, kw: string) => s + (text.includes(kw) ? 1 : 0), 0);
        return { doc, metadata, score };
      })
      .filter((item: FilteredDoc) => {
        const passesFilters = applyExactFilters(item.metadata, filters);
        const passesKeywords = keywords.length === 0 || item.score > 0;
        const result = hasFilters ? passesFilters : passesKeywords;
        if (message.toLowerCase() === "ortra" || filters.category === "design") {
          console.log("Item:", item.metadata.title, "Score:", item.score, "Passes:", result);
        }
        return result;
      })
      .sort((a: FilteredDoc, b: FilteredDoc) => b.score - a.score || a.doc.metadata._distance - b.doc.metadata._distance);

    const links = filteredDocs.map(({ doc, metadata }) => ({
      title: metadata.title || doc.pageContent || "Untitled",
      url: metadata.url || "No URL provided",
      description: metadata.description || "No description available",
      image: metadata.imageUrl || "",
      tags: metadata.tags || [],
      category: metadata.categories?.[0] || "",
      isFavorite: metadata.isFavorite || false,
      dateAdded: metadata.dateAdded || "Unknown date",
    }));

    const uniqueLinks = Array.from(new Map(links.map(link => [link.url, link])).values());
    const paginatedLinks = uniqueLinks.slice(offset, offset + limit);

    const answerMessage = paginatedLinks.length > 0
      ? `Here are your matching links (${offset + 1}-${offset + paginatedLinks.length} of ${uniqueLinks.length}):\n` +
        paginatedLinks.map(link => `* ${link.title} - ${link.url}`).join("\n")
      : "No links found. Try a more specific query like 'category:design' or a keyword.";

    const result = { answer: answerMessage, links: paginatedLinks, total: uniqueLinks.length };
    console.log("Final chatbot results:", result);
    cache.set(cacheKey, result);
    return res.status(200).json(result);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in /api/chat:", error);
    return res.status(500).json({ error: "Internal server error", details: errorMessage });
  }
}

function parseMetadata(doc: any) {
  try {
    return doc.metadata.metadata && typeof doc.metadata.metadata === "string"
      ? JSON.parse(doc.metadata.metadata)
      : {};
  } catch (e) {
    console.error("Failed to parse metadata:", doc, e);
    return {};
  }
}

function applyExactFilters(metadata: any, filters: any) {
  const { category, tag, title, description, date } = filters;
  const tags = (metadata.tags || []).map((t: string) => t.toLowerCase());
  const categories = (metadata.categories || []).map((c: string) => c.toLowerCase());
  return (!category || categories.includes(category.toLowerCase())) &&
         (!tag || tags.includes(tag)) &&
         (!title || metadata.title?.toLowerCase().includes(title)) &&
         (!description || metadata.description?.toLowerCase().includes(description)) &&
         (!date || metadata.dateAdded?.includes(date));
}