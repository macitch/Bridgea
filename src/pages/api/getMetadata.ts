import type { NextApiRequest, NextApiResponse } from 'next';

// Import helper functions to fetch metadata using Axios or Puppeteer,
// determine the appropriate fetching method, and define the Metadata type.
import { 
  fetchMetadataWithAxios, 
  fetchMetadataWithPuppeteer, 
  determineFetchMethod, 
  Metadata 
} from '@/provider/AI/fetchMetadata';

// Import AI functions for categorization and tag processing.
import { categorisedWithAI } from '@/provider/AI/processCategorisedWithAI';
import { processTagsWithAI } from '@/provider/AI/processTagsWithAI';

// Create a Set to track ongoing requests by URL. This prevents duplicate processing.
const processingRequests = new Set<string>();

/**
 * API Route Handler: Fetches and enriches metadata from a given URL.
 *
 * Workflow:
 * 1. Validate the URL parameter.
 * 2. Prevent duplicate processing by checking the processingRequests Set.
 * 3. Determine the optimal fetch method (Axios for static pages or Puppeteer for JS-heavy pages).
 * 4. Fetch the raw metadata from the URL.
 * 5. Use an AI service (Gemini) to categorize the content.
 * 6. Process tags using AI:
 *    - Enhance existing tags or generate new ones.
 * 7. Return the enriched metadata as a JSON response.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Extract the URL from the query string.
  const { url } = req.query;

  // Validate that the URL parameter is a non-empty string.
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // If a request for this URL is already in progress, return a 429 status.
  if (processingRequests.has(url)) {
    return res.status(429).json({ error: 'Request already in progress. Please wait.' });
  }

  // Mark this URL as being processed.
  processingRequests.add(url);

  try {
    // Determine which method to use to fetch metadata (Axios or Puppeteer).
    const method = await determineFetchMethod(url);
    let metadata: Metadata;

    // Fetch metadata using Axios if the page is static; otherwise, use Puppeteer.
    if (method === 'axios') {
      metadata = await fetchMetadataWithAxios(url);
    } else {
      metadata = await fetchMetadataWithPuppeteer(url);
    }

    // Use an AI service to generate broad categories for the content.
    metadata.categories = await categorisedWithAI(metadata);

    // Process or generate tags using the AI service.
    metadata.tags = await processTagsWithAI({
      title: metadata.title,
      description: metadata.description,
      tags: metadata.tags,
    });

    // Respond with the enriched metadata in JSON format.
    res.status(200).json(metadata);
  } catch (error) {
    // Log any errors and return a 500 Internal Server Error response.
    console.error('Error fetching metadata:', error);
    res.status(500).json({ error: 'Failed to fetch metadata' });
  } finally {
    // Remove the URL from the processingRequests Set to allow future requests.
    processingRequests.delete(url);
  }
}