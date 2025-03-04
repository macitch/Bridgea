// Import the necessary functions and classes from LanceDB and LangChain libraries.
import { connect, Table } from "@lancedb/lancedb";
import { LanceDB } from "@langchain/community/vectorstores/lancedb";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

/**
 * Asynchronously initializes LanceDB for a given user.
 *
 * This function connects to a local LanceDB directory specific to the user,
 * checks if the designated table for vector data exists, creates it if necessary,
 * and then returns a new LanceDB instance configured with the appropriate embeddings.
 *
 * @param userId - The unique identifier for the user.
 * @returns A promise that resolves to a LanceDB instance.
 */
export async function initializeLanceDB(userId: string): Promise<LanceDB> {
  try {
    // Log the start of the LanceDB connection for the specified user.
    console.log(`Connecting to LanceDB for user ${userId}`);
    // Connect to the local LanceDB data directory specific to this user.
    const db = await connect(`./lancedb-data/${userId}`);
    // Define the table name to store vector data.
    const tableName = "links_vectors";

    // Retrieve all existing table names in the connected LanceDB.
    const tables = await db.tableNames();
    let table: Table;
    
    // Initialize the embeddings instance using Google Generative AI.
    // This instance is used to generate embedding vectors for link content.
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      modelName: "gemini-1.5-pro",
    });
    // Determine the size of the embedding vector by embedding a test string.
    const vectorSize = (await embeddings.embedQuery("test")).length;

    // Check if the table exists. If not, create a new table with the defined schema.
    if (!tables.includes(tableName)) {
      console.log(`Creating table ${tableName} for user ${userId}`);
      table = await db.createTable(tableName, [
        // Define the schema for the new table:
        // 'vector' is an array whose length is equal to the vector size,
        // 'text', 'id', and 'metadata' are string fields.
        { vector: Array(vectorSize), text: "", id: "", metadata: "" },
      ]);
    } else {
      // If the table already exists, open the existing table.
      console.log(`Opening existing table ${tableName} for user ${userId}`);
      table = await db.openTable(tableName);
    }

    // Return a new LanceDB instance, configured with the embeddings and table.
    return new LanceDB(embeddings, { table });
  } catch (error) {
    // Log any errors encountered during initialization.
    console.error(`Failed to initialize LanceDB for user ${userId}:`, error);
    // Rethrow the error so that the calling code can handle it.
    throw error;
  }
}