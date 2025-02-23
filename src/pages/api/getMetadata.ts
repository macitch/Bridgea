import type { NextApiRequest, NextApiResponse } from 'next';

// Import helper functions for fetching metadata and processing it.
import { 
  fetchMetadataWithAxios, 
  fetchMetadataWithPuppeteer, 
  determineFetchMethod, 
  Metadata 
} from '@/provider/AI/fetchMetadata';

// Import AI-based categorization function.
import { categorisedWithAI } from '@/provider/AI/processCategorisedWithAI';

// Import AI-based tag processing function.
import { processTagsWithAI } from '@/provider/AI/processTagsWithAi';

// A Set to keep track of ongoing requests for a specific URL.
// This prevents duplicate processing if multiple requests for the same URL occur simultaneously.
const processingRequests = new Set<string>();

/**
 * API route handler that fetches metadata from a given URL.
 *
 * The workflow is as follows:
 * 1. Validate the URL parameter.
 * 2. Prevent duplicate requests using the processingRequests Set.
 * 3. Determine which fetching method to use (Axios or Puppeteer).
 * 4. Fetch metadata from the target URL.
 * 5. Use an AI service (Gemini) to categorize the content.
 * 6. Process tags:
 *    - If tags are present, rank and return the top ones.
 *    - If no tags are available, generate new ones using the AI.
 * 7. Return the enriched metadata as a JSON response.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Extract the URL parameter from the query string.
  const { url } = req.query;

  // Validate the URL; it must be a non-empty string.
  if (!url || typeof url !== 'string') {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  // Check if there's already a request processing this URL.
  if (processingRequests.has(url)) {
    return res.status(429).json({ error: 'Request already in progress. Please wait.' });
  }

  // Mark the URL as currently processing.
  processingRequests.add(url);

  try {
    // Determine whether to use Axios or Puppeteer based on the target page's characteristics.
    const method = await determineFetchMethod(url);
    let metadata: Metadata;

    // Use Axios if the page is static; fallback to Puppeteer for JS-heavy pages.
    if (method === 'axios') {
      metadata = await fetchMetadataWithAxios(url);
    } else {
      metadata = await fetchMetadataWithPuppeteer(url);
    }

    // AI-based categorization:
    // Use the Gemini AI service to generate broad categories based on the metadata.
    metadata.categories = await categorisedWithAI(metadata);

    // AI-based tag processing:
    // Process existing tags (or generate new ones if none are present) using Gemini.
    metadata.tags = await processTagsWithAI({
      title: metadata.title,
      description: metadata.description,
      tags: metadata.tags,
    });

    // Return the processed metadata as a JSON response.
    res.status(200).json(metadata);
  } catch (error) {
    // Log any errors that occur during the process and return a 500 error response.
    console.error('Error fetching metadata:', error);
    res.status(500).json({ error: 'Failed to fetch metadata' });
  } finally {
    // Remove the URL from the processingRequests Set so future requests can be handled.
    processingRequests.delete(url);
  }
}