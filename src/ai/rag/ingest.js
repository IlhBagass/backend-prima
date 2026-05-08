import { sql } from "../../config/db.js";
import { extractTextFromBuffer } from "../rag/loader.js";
import { splitText } from "./chunker.js";
import { getEmbeddings } from "./embedding.js";
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

  const batchSize = Number(process.env.EMBEDDINGS_BATCH_SIZE || 16);
  console.log(`[processPDF] Generating embeddings (batch size ${batchSize})...`);

  for (let start = 0; start < chunks.length; start += batchSize) {
    const end = Math.min(chunks.length, start + batchSize);
    console.log(`[processPDF] Embedding batch ${start + 1}-${end}/${chunks.length}`);

    const batchChunks = chunks.slice(start, end);
    const embeddings = await getEmbeddings(batchChunks);

    for (let j = 0; j < batchChunks.length; j++) {
      const i = start + j;
      const embedding = embeddings[j];
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
            ${batchChunks[j]},
            ${i},
            to_json(${embedding}::float8[])::text::vector
          )
        `;
      } catch (chunkError) {
        console.error(`[processPDF] FAILED chunk ${i}:`, chunkError.message);
        throw new Error(`Insert chunk ${i} gagal: ${chunkError.message}`);
      }
    }
  }

  console.log("[processPDF] Selesai, total chunks:", chunks.length);

  return {
    document_id: doc.id,
    total_chunks: chunks.length
  };
};
