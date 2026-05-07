import { neon } from "@neondatabase/serverless";
import { getEnv } from "./env.js";

const databaseUrl = getEnv("DATABASE_URL");

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
      CREATE TABLE IF NOT EXISTS documents (
        id UUID PRIMARY KEY,
        title TEXT NOT NULL,
        file_url TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    console.log("[initDatabase] Tabel 'documents' OK.");

    // 3. Create document_chunks table
    await sql`
      CREATE TABLE IF NOT EXISTS document_chunks (
        id UUID PRIMARY KEY,
        document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        chunk_index INTEGER NOT NULL,
        embedding VECTOR(384),
        UNIQUE(document_id, chunk_index)
      );
    `;
    console.log("[initDatabase] Tabel 'document_chunks' OK.");

    // 4. Create index for similarity search (ignore if already exists)
    try {
      await sql`
        CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
        ON document_chunks USING ivfflat (embedding vector_cosine_ops)
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
