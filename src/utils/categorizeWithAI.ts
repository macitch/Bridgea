import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI with API key from .env
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

/**
 * Uses Gemini AI to categorize a link based on metadata.
 */
export async function categorizeWithGemini(metadata: { title: string; description: string; tags: string[] }): Promise<string[]> {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  const prompt = `
  Given the following metadata, classify the link into a broad category:

  Title: ${metadata.title}
  Description: ${metadata.description}
  Tags: ${metadata.tags.join(", ")}

  **Output the categories as a JSON array only, without any additional text or formatting.**
  `;

  try {
    const response = await model.generateContent(prompt);
    let result = response.response.text(); // Gemini returns a text response

    // ✅ Clean response: Remove code blocks (e.g., ```json ... ```)
    result = result.replace(/```json|```/g, "").trim();

    // ✅ Ensure it's valid JSON
    return JSON.parse(result || "[]");
  } catch (error) {
    console.error("Error fetching AI categories from Gemini:", error);
    return [];
  }
}