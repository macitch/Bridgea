import type { NextApiRequest, NextApiResponse } from "next";
// Import the function to initialize the LanceDB vector store.
import { initializeLanceDB } from "../../provider/LanceDB/lancedb";
// Import parse from qs to handle query string parsing.
import { parse } from "qs";
// Import NodeCache for caching API responses.
import NodeCache from "node-cache";

// Create a cache instance with a 5-minute time-to-live.
const cache = new NodeCache({ stdTTL: 300 }); // 300 seconds = 5 minutes

// Define the structure of a filtered document after processing.
interface FilteredDoc {
  doc: any;
  metadata: any;
  score: number;
}

// API handler for synchronizing and retrieving matching links.
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Only allow POST requests.
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  // Extract parameters from the request body.
  const { message, sessionId, k = 20, offset = 0, limit = 10 } = req.body; // Increased default k
  // Validate required parameters.
  if (!message || !sessionId)
    return res.status(400).json({ error: "Message and sessionId are required" });

  // Create a unique cache key based on the sessionId, message, and pagination parameters.
  const cacheKey = `${sessionId}:${message}:${k}:${offset}:${limit}`;
  // If a cached result exists, return it immediately.
  const cachedResult = cache.get(cacheKey);
  if (cachedResult) return res.status(200).json(cachedResult);

  try {
    // Initialize the LanceDB vector store for the given sessionId.
    const vectorStore = await initializeLanceDB(sessionId);
    // Get a retriever with a specified number of nearest neighbors (k).
    const retriever = vectorStore.asRetriever({ k });
    // Retrieve relevant documents based on the provided message.
    const docs = await retriever.getRelevantDocuments(message);
    console.log("Initial docs from LanceDB:", docs.length); // Debug: log the number of initial docs

    // Parse the message into query parameters using whitespace as delimiter.
    const queryParams = parse(message.toLowerCase(), { delimiter: /\s+/ });
    // Build a filters object based on potential query parameters.
    const filters = {
      category: queryParams.category,
      tag: queryParams.tag || queryParams.tags,
      title: queryParams.title,
      description: queryParams.description,
      date: queryParams.date || queryParams.month,
    };
    // Split the message into individual keywords and remove any keys used for filters.
    const keywords: string[] = message
      .toLowerCase()
      .split(/\s+/)
      .filter((w: string) => !Object.keys(filters).includes(w));
    // Check if any filters have been specified.
    const hasFilters = Object.values(filters).some(value => value !== undefined);

    // Process and filter the retrieved documents.
    const filteredDocs = docs
      .map((doc: any) => {
        // Parse the metadata for each document.
        const metadata = parseMetadata(doc);
        // Create a searchable text string from various metadata fields.
        const text = `${metadata.title || ""} ${metadata.description || ""} ${metadata.tags?.join(" ") || ""} ${metadata.url || ""}`.toLowerCase();
        // Calculate a simple score based on the occurrence of each keyword.
        const score = keywords.reduce((s: number, kw: string) => s + (text.includes(kw) ? 1 : 0), 0);
        return { doc, metadata, score };
      })
      .filter((item: FilteredDoc) => {
        // Determine if the item passes the exact filters.
        const passesFilters = applyExactFilters(item.metadata, filters);
        // Determine if the item passes keyword matching.
        const passesKeywords = keywords.length === 0 || item.score > 0;
        // If filters are present, use them; otherwise, rely on keywords.
        const result = hasFilters ? passesFilters : passesKeywords;
        // Debug: Log details for specific test cases.
        if (message.toLowerCase() === "ortra" || filters.category === "design") {
          console.log("Item:", item.metadata.title, "Score:", item.score, "Passes:", result);
        }
        return result;
      })
      // Sort the documents by score descending, or by distance if scores are equal.
      .sort((a: FilteredDoc, b: FilteredDoc) => b.score - a.score || a.doc.metadata._distance - b.doc.metadata._distance);

    // Map the filtered documents into a standardized link format.
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

    // Remove duplicate links based on URL.
    const uniqueLinks = Array.from(new Map(links.map(link => [link.url, link])).values());
    // Apply pagination to the unique links.
    const paginatedLinks = uniqueLinks.slice(offset, offset + limit);

    // Construct an answer message that summarizes the results.
    const answerMessage = paginatedLinks.length > 0
      ? `Here are your matching links (${offset + 1}-${offset + paginatedLinks.length} of ${uniqueLinks.length}):\n` +
        paginatedLinks.map(link => `* ${link.title} - ${link.url}`).join("\n")
      : "No links found. Try a more specific query like 'category:design' or a keyword.";

    // Prepare the final result object.
    const result = { answer: answerMessage, links: paginatedLinks, total: uniqueLinks.length };
    console.log("Final chatbot results:", result);
    // Cache the result for subsequent identical requests.
    cache.set(cacheKey, result);
    // Return the result as a successful JSON response.
    return res.status(200).json(result);
  } catch (error: unknown) {
    // Extract error message if available and log the error.
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in /api/chat:", error);
    return res.status(500).json({ error: "Internal server error", details: errorMessage });
  }
}

// parseMetadata function: Attempts to parse the metadata JSON string from a document.
function parseMetadata(doc: any) {
  try {
    // If the metadata is a string, parse it as JSON.
    return doc.metadata.metadata && typeof doc.metadata.metadata === "string"
      ? JSON.parse(doc.metadata.metadata)
      : {};
  } catch (e) {
    console.error("Failed to parse metadata:", doc, e);
    return {};
  }
}

// applyExactFilters function: Checks if a document's metadata passes exact filters.
function applyExactFilters(metadata: any, filters: any) {
  // Destructure potential filter criteria.
  const { category, tag, title, description, date } = filters;
  // Normalize tags and categories to lowercase for comparison.
  const tags = (metadata.tags || []).map((t: string) => t.toLowerCase());
  const categories = (metadata.categories || []).map((c: string) => c.toLowerCase());
  // Return true if all specified filters pass, or false otherwise.
  return (!category || categories.includes(category.toLowerCase())) &&
         (!tag || tags.includes(tag)) &&
         (!title || metadata.title?.toLowerCase().includes(title)) &&
         (!description || metadata.description?.toLowerCase().includes(description)) &&
         (!date || metadata.dateAdded?.includes(date));
}