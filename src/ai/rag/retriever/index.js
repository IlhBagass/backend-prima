import { sql } from "../../../config/db.js";

export async function retrieveRelevantChunks(queryEmbedding, documentId) {
  const embeddingVector = `[${queryEmbedding.join(",")}]`;

  const results = await sql`
    SELECT content
    FROM document_chunks
    WHERE document_id = ${documentId}
    ORDER BY embedding <-> ${sql.unsafe(`'${embeddingVector}'::vector`)}
    LIMIT 5
  `;

  return results.map(r => r.content);
}