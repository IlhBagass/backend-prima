import { neon } from "@neondatabase/serverless";
import { getEnv } from "./env.js";

const databaseUrl = getEnv("DATABASE_URL");

export const sql = databaseUrl
  ? neon(databaseUrl)
  : () => {
      throw new Error("DATABASE_URL belum diset.");
    };

export async function initPgvector() {
  if (!databaseUrl) {
    console.warn("[initPgvector] DATABASE_URL tidak ada.");
    return;
  }

  try {
    // hanya enable extension pgvector
    await sql`CREATE EXTENSION IF NOT EXISTS vector;`;

    console.log("[initPgvector] pgvector siap.");
  } catch (err) {
    console.error(
      "[initPgvector] Gagal enable pgvector:",
      err.message
    );
  }
}

export async function initDatabase() {
  if (!databaseUrl) {
    console.warn("[initDatabase] DATABASE_URL tidak ada.");
    return;
  }

  const embeddingDim = (() => {
    const explicit = Number(process.env.EMBEDDING_DIM);
    if (Number.isFinite(explicit) && explicit > 0) return explicit;
    const model = (process.env.MAIA_EMBED_MODEL || process.env.MAIA_MODEL || "").trim();
    if (model.includes("text-embedding-3")) return 1536;
    return 384;
  })();

  await initPgvector();

  await sql`
    CREATE TABLE IF NOT EXISTS public.documents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      file_url TEXT NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `;

  await sql.unsafe(`
    CREATE TABLE IF NOT EXISTS public.document_chunks (
      id UUID PRIMARY KEY,
      document_id TEXT NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      chunk_index INTEGER NOT NULL,
      embedding VECTOR(${embeddingDim}),
      created_at TIMESTAMPTZ DEFAULT NOW(),
      UNIQUE(document_id, chunk_index)
    );
  `);
}
