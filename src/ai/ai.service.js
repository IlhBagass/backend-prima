import { sql } from "../config/db.js"; 
import { ragPipeline } from "../ai/rag/pipeline.js";
import { llm } from "../ai/provider/llm.js";

async function callWithRetry(fn, retries = 3) {
  try {
    return await fn();
  } catch (err) {
    if (err.message?.includes("429") && retries > 0) {
      console.log("Rate limit kena, retry...");
      await new Promise(r => setTimeout(r, 2000));
      return callWithRetry(fn, retries - 1);
    }
    throw err;
  }
}

export async function askAI({ question }) {

  const [doc] = await sql`
    SELECT id
    FROM documents
    ORDER BY created_at DESC
    LIMIT 1
  `;

  if (!doc) {
    throw new Error("Belum ada dokumen diupload");
  }

  const result = await callWithRetry(() =>
    ragPipeline({
      question,
      documentId: doc.id,
      llm
    })
  );

  return result;
}