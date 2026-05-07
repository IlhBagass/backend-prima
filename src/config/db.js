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
