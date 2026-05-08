import { neon } from "@neondatabase/serverless";
import { getEnv } from "./env.js";

const databaseUrl = getEnv("DATABASE_URL");
const embeddingDim = (() => {
  const explicit = Number(getEnv("EMBEDDING_DIM"));
  if (Number.isFinite(explicit) && explicit > 0) return explicit;

  const model = getEnv("MAIA_EMBED_MODEL") || getEnv("MAIA_MODEL") || "";
  // Default: Xenova/all-MiniLM-L6-v2 -> 384, OpenAI text-embedding-3-* -> 1536 (default)
  if (model.includes("text-embedding-3")) return 1536;
  return 384;
})();

export const sql = databaseUrl
  ? neon(databaseUrl)
  : () => {
      throw new Error(
        "Missing required environment variable: DATABASE_URL. Set it in Vercel Project Settings → Environment Variables, then redeploy."
      );
    };

export async function initPgvector() {
  if (!databaseUrl) {
    console.warn("[initPgvector] DATABASE_URL tidak ada, skip init.");
    return;
  }
  try {
    await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
    console.log("[initPgvector] Extension 'vector' sudah aktif / berhasil dibuat.");
  } catch (err) {
    console.error("[initPgvector] Gagal enable pgvector:", err.message);
    console.error("Pastikan database PostgreSQL mendukung pgvector.");
  }
}

export async function initDatabase() {
  if (!databaseUrl) {
    console.warn("[initDatabase] DATABASE_URL tidak ada, skip init.");
    return;
  }

  try {
    // 1. Enable pgvector
    await sql`CREATE EXTENSION IF NOT EXISTS vector;`;
    console.log("[initDatabase] Extension 'vector' OK.");

    // 2. Create documents table
    await sql`
      CREATE TABLE IF NOT EXISTS public.documents (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        file_url TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log("[initDatabase] Tabel 'documents' OK.");

    // 2.5 Ensure document_chunks embedding dimension matches configured embeddingDim
    try {
      // Kalau tabel belum ada, skip cek dimensi (akan dibuat di step 3)
      const [{ table_exists } = {}] = await sql`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'document_chunks'
        ) as table_exists;
      `;

      if (!table_exists) {
        throw new Error("table_missing");
      }

      const [{ atttypmod } = {}] = await sql`
        SELECT a.atttypmod
        FROM pg_attribute a
        JOIN pg_class c ON a.attrelid = c.oid
        JOIN pg_namespace n ON c.relnamespace = n.oid
        WHERE n.nspname = 'public'
          AND c.relname = 'document_chunks'
          AND a.attname = 'embedding'
          AND a.attnum > 0
          AND NOT a.attisdropped
        LIMIT 1;
      `;

      if (typeof atttypmod === "number" && atttypmod > 4) {
        const currentDim = atttypmod - 4; // pgvector stores typmod as (dim + 4)
        if (currentDim !== embeddingDim) {
          console.warn(
            `[initDatabase] Dimensi embedding berubah (${currentDim} -> ${embeddingDim}). Recreate table 'document_chunks' (data chunks akan terhapus).`
          );
          await sql`DROP INDEX IF EXISTS idx_document_chunks_embedding;`;
          await sql`DROP TABLE IF EXISTS document_chunks;`;
        }
      }
    } catch (dimErr) {
      if (dimErr.message !== "table_missing") {
        console.warn("[initDatabase] Skip cek dimensi embedding:", dimErr.message);
      }
    }

    // 3. Create document_chunks table
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
    console.log("[initDatabase] Tabel 'document_chunks' OK.");

    // 4. Create index for similarity search (ignore if already exists)
    try {
      await sql`
        CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
        ON public.document_chunks USING ivfflat (embedding vector_cosine_ops)
        WITH (lists = 100);
      `;
      console.log("[initDatabase] Index 'idx_document_chunks_embedding' OK.");
    } catch (idxErr) {
      console.warn("[initDatabase] Index creation skipped:", idxErr.message);
    }

    console.log("[initDatabase] Semua tabel dan extension sudah siap.");
  } catch (err) {
    console.error("[initDatabase] Gagal init database:", err.message);
    throw err;
  }
}
