-- Schema untuk AI RAG (Run once on database)

-- Enable pgvector extension (di Neon biasanya sudah ada, tapi aman dijalankan ulang)
CREATE EXTENSION IF NOT EXISTS vector;

-- Tabel dokumen PDF yang diupload
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  file_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabel chunks dari dokumen dengan embedding vector
CREATE TABLE IF NOT EXISTS document_chunks (
  id UUID PRIMARY KEY,
  document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  chunk_index INTEGER NOT NULL,
  embedding VECTOR(1536), -- OpenAI text-embedding-3-* default 1536 (sesuaikan jika model beda)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(document_id, chunk_index)
);

-- Index untuk similarity search (optional tapi direkomendasikan)
CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
ON document_chunks USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
