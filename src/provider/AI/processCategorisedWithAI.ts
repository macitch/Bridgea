import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI using the API key from your environment variables.
// This instance will be used for all subsequent calls to Gemini.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

/**
 * Uses Gemini AI to categorize a link based on its metadata.
 *
 * This function sends a prompt to Gemini that includes the link's title,
 * description, and tags. Gemini then returns broad categories for the link
 * in the form of a JSON array.
 *
 * @param metadata - An object containing the title, description, and tags of the link.
 * @returns A promise that resolves to an array of category strings.
 */
export async function categorisedWithAI(metadata: { title: string; description: string; tags: string[] }): Promise<string[]> {
  // Get the generative model instance (using the "gemini-pro" model).
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  
  // Build a dynamic prompt using the provided metadata.
  // The prompt instructs Gemini to classify the link into broad categories.
  const prompt = `
Given the following metadata, classify the link into a broad category:

Title: ${metadata.title}
Description: ${metadata.description}
Tags: ${metadata.tags.join(", ")}

**Output the categories as a JSON array only, without any additional text or formatting.**
  `;
  
  // Optional: Log the prompt for debugging purposes.
  console.log("Categorisation prompt sent to Gemini:", prompt);
  
  try {
    // Send the prompt to Gemini AI and wait for the response.
    const response = await model.generateContent(prompt);
    
    // Extract the text output from the response.
    let result = response.response.text();
    
    // Debug: Log the raw output from Gemini.
    console.log("Raw response from Gemini:", result);
    
    // Remove any code block markers (like ```json or ```) that might be present.
    result = result.replace(/```json|```/g, "").trim();
    
    // Debug: Log the cleaned result.
    console.log("Cleaned result:", result);
    
    // Parse the cleaned text as JSON.
    // If parsing fails or the result is empty, default to an empty array.
    return JSON.parse(result || "[]");
  } catch (error) {
    // Log any errors encountered during the AI categorization process.
    console.error("Error fetching AI categories from Gemini:", error);
    return [];
  }
}