import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI using the API key from your environment variables.
// This instance will be used for all subsequent calls to Gemini.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

/**
 * categorisedWithAI
 *
 * Uses Gemini AI to categorize a link based on its metadata.
 * It sends a prompt to Gemini including the link's title, description, and tags,
 * and expects a JSON array response with broad categories.
 *
 * @param metadata - An object containing the title, description, and tags of the link.
 * @returns A promise that resolves to an array of category strings.
 */
export async function categorisedWithAI(metadata: { title: string; description: string; tags: string[] }): Promise<string[]> {
  // Retrieve the generative model instance, specifying the "gemini-1.5-pro" model.
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  
  // Build a dynamic prompt that instructs Gemini to classify the link.
  // The prompt includes the link's title, description, and tags.
  // It explicitly requests a JSON array output without additional text.
  const prompt = `
Given the following metadata, classify the link into a broad category:

Title: ${metadata.title}
Description: ${metadata.description}
Tags: ${metadata.tags.join(", ")}

**Output the categories as a JSON array only, without any additional text or formatting.**
  `;
  
  // Log the prompt for debugging purposes.
  console.log("Categorisation prompt sent to Gemini:", prompt);
  
  try {
    // Send the prompt to Gemini AI and wait for the response.
    const response = await model.generateContent(prompt);
    
    // Extract the text output from the response.
    let result = response.response.text();
    
    // Log the raw response for debugging.
    console.log("Raw response from Gemini:", result);
    
    // Remove any code block markers (e.g., ```json or ```) that might be present in the output.
    result = result.replace(/```json|```/g, "").trim();
    
    // Log the cleaned result.
    console.log("Cleaned result:", result);
    
    // Parse the cleaned text as JSON.
    // If parsing fails or the result is empty, default to an empty array.
    return JSON.parse(result || "[]");
  } catch (error) {
    // Log any errors encountered during the categorization process.
    console.error("Error fetching AI categories from Gemini:", error);
    // Return an empty array if an error occurs.
    return [];
  }
}