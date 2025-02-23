import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI using the API key from your environment variables.
// This creates an instance of the Gemini AI client that you can use to generate content.
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);

/**
 * Processes tags using Gemini AI.
 * 
 * This function serves two purposes:
 * 1. If the metadata already includes tags, it ranks them based on relevance using a scoring system.
 * 2. If no tags are provided, it dynamically generates tags via Gemini AI.
 *
 * @param metadata - An object containing title, description, and an array of tags.
 * @returns A promise that resolves to an array of up to 5 relevant tags.
 */
export async function processTagsWithAI(metadata: { title: string; description: string; tags: string[] }): Promise<string[]> {
  // Check if there are any tags provided in the metadata.
  if (metadata.tags && metadata.tags.length > 0) {
    // Convert the title and description to lowercase for case-insensitive matching.
    const titleLower = metadata.title.toLowerCase();
    const descriptionLower = metadata.description.toLowerCase();

    // Define a set of generic or overly common tags that should be downranked.
    const genericTags = new Set(["design", "brand", "logo"]);

    // Map each tag to an object that includes the tag and its computed score.
    const scoredTags = metadata.tags.map(tag => {
      const lowerTag = tag.toLowerCase();
      let score = 0;

      // Award bonus points if the tag appears in the title or description.
      if (titleLower.includes(lowerTag)) score += 3;
      if (descriptionLower.includes(lowerTag)) score += 2;

      // Increase the score based on the number of words in the tag (multi-word tags are favored).
      const wordCount = tag.split(" ").filter(Boolean).length;
      score += wordCount;

      // Penalize single-word tags if they are too generic.
      if (wordCount === 1 && genericTags.has(lowerTag)) score -= 1;

      return { tag, score };
    });

    // Sort the tags in descending order of their scores.
    scoredTags.sort((a, b) => b.score - a.score);

    // Select the top 5 tags (or fewer if there aren't enough) based on their scores.
    const topTags = scoredTags.slice(0, 5).map(item => item.tag);

    // Log the ranked tags for debugging purposes.
    console.log("Returning ranked tags:", topTags);
    return topTags;
  } else {
    // If no tags are provided, generate them using Gemini AI.
    const generatedTags = await generateTagsWithGemini(metadata);
    
    // Log the generated tags for debugging.
    console.log("Returning generated tags from Gemini:", generatedTags);
    return generatedTags;
  }
}

/**
 * Generates tags using Gemini AI by building a dynamic prompt.
 * 
 * This function creates a prompt based on the provided metadata (title and description)
 * and asks Gemini AI to return a comma-separated list of 5 relevant and concise tags.
 *
 * @param metadata - An object containing title, description, and optionally tags.
 * @returns A promise that resolves to an array of generated tags.
 */
async function generateTagsWithGemini(metadata: { title: string; description: string; tags?: string[] }): Promise<string[]> {
  // Get the generative model instance (using the "gemini-pro" model in this case).
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });
  
  // Build the prompt dynamically using the title and description from metadata.
  // The prompt instructs Gemini to generate 5 concise tags.
  const prompt = `
Given the following metadata, generate a list of 5 relevant and concise tags that best describe the content.
  
Title: "${metadata.title}"
Description: "${metadata.description}"

Output the tags as a comma-separated list without any additional text.
  `;
  
  try {
    // Log the prompt being sent for debugging purposes.
    console.log("Generating tags with Gemini using prompt:", prompt);

    // Send the prompt to Gemini and wait for its response.
    const response = await model.generateContent(prompt);
    
    // Extract the raw text output from the response.
    let result = response.response.text();
    
    // Clean the output by removing any code block markers or formatting artifacts.
    result = result.replace(/```json|```/g, "").trim();
    
    // Split the cleaned output by commas, trim any extra whitespace from each tag, and filter out empty strings.
    const tags = result.split(",").map(tag => tag.trim()).filter(Boolean);
    
    // Log the raw output and the parsed tags for debugging purposes.
    console.log("Gemini raw output:", result);
    console.log("Parsed tags:", tags);
    
    return tags;
  } catch (error) {
    // Log any errors encountered during the tag generation process.
    console.error("Error generating tags from Gemini:", error);
    return [];
  }
}