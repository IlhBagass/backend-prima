import { sql } from "../../config/db.js";
import { extractTextFromBuffer } from "../rag/loader.js";
import { splitText } from "./chunker.js";
import { getEmbedding } from "./embedding.js";
import crypto from "crypto";

export const processPDF = async ({ fileBuffer, fileUrl, title }) => {
  const documentId = crypto.randomUUID();

  console.log("[processPDF] Mulai upload doc:", title);

  const [doc] = await sql`
    INSERT INTO documents (id, title, file_url)
    VALUES (${documentId}, ${title}, ${fileUrl})
    RETURNING id
  `;

  console.log("[processPDF] Document inserted:", doc.id);

  const text = await extractTextFromBuffer(fileBuffer);
  console.log("[processPDF] Text extracted, length:", text.length);

  const chunks = splitText(text);
  console.log("[processPDF] Total chunks:", chunks.length);

  console.log("[processPDF] Generating embeddings...");
  const embeddings = await Promise.all(
    chunks.map((chunk, idx) => {
      console.log(`[processPDF] Embedding chunk ${idx + 1}/${chunks.length}`);
      return getEmbedding(chunk);
    })
  );
  console.log("[processPDF] All embeddings done");

  for (let i = 0; i < chunks.length; i++) {
    const embedding = embeddings[i];
    console.log(`[processPDF] Inserting chunk ${i + 1}/${chunks.length}`);

    try {
      await sql`
        INSERT INTO document_chunks (
          id,
          document_id,
          content,
          chunk_index,
          embedding
        )
        VALUES (
          ${crypto.randomUUID()},
          ${doc.id},
          ${chunks[i]},
          ${i},
          to_json(${embedding}::float8[])::text::vector
        )
      `;
    } catch (chunkError) {
      console.error(`[processPDF] FAILED chunk ${i}:`, chunkError.message);
      throw new Error(`Insert chunk ${i} gagal: ${chunkError.message}`);
    }
  }

  console.log("[processPDF] Selesai, total chunks:", chunks.length);

  return {
    document_id: doc.id,
    total_chunks: chunks.length
  };
};