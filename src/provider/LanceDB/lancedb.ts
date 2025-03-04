import { connect, Table } from "@lancedb/lancedb";
import { LanceDB } from "@langchain/community/vectorstores/lancedb";
import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";

export async function initializeLanceDB(userId: string): Promise<LanceDB> {
  try {
    console.log(`Connecting to LanceDB for user ${userId}`);
    const db = await connect(`./lancedb-data/${userId}`);
    const tableName = "links_vectors";

    const tables = await db.tableNames();
    let table: Table;
    const embeddings = new GoogleGenerativeAIEmbeddings({
      apiKey: process.env.GEMINI_API_KEY,
      modelName: "embedding-001",
    });
    const vectorSize = (await embeddings.embedQuery("test")).length;

    if (!tables.includes(tableName)) {
      console.log(`Creating table ${tableName} for user ${userId}`);
      table = await db.createTable(tableName, [
        { vector: Array(vectorSize), text: "", id: "", metadata: "" },
      ]);
    } else {
      console.log(`Opening existing table ${tableName} for user ${userId}`);
      table = await db.openTable(tableName);
    }

    return new LanceDB(embeddings, { table });
  } catch (error) {
    console.error(`Failed to initialize LanceDB for user ${userId}:`, error);
    throw error;
  }
}