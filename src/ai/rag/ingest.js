import { sql } from "../../config/db.js";
import { extractTextFromBuffer } from "../rag/loader.js";
import { splitText } from "./chunker.js";
import { getEmbedding } from "./embedding.js";
import crypto from "crypto";

export const processPDF = async ({ fileBuffer, fileUrl, title }) => {
  const documentId = crypto.randomUUID();

  const [doc] = await sql`
    INSERT INTO documents (id, title, file_url)
    VALUES (${documentId}, ${title}, ${fileUrl})
    RETURNING id
  `;

  const text = await extractTextFromBuffer(fileBuffer);
  const chunks = splitText(text);

  const embeddings = await Promise.all(
    chunks.map(chunk => getEmbedding(chunk))
  );

  for (let i = 0; i < chunks.length; i++) {
    const embedding = embeddings[i];

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
  }

  return {
    document_id: doc.id,
    total_chunks: chunks.length
  };
};