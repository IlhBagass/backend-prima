import cloudinary from "../../config/cloudinary.js";
import { processPDF } from "../rag/ingest.js";
import { initDatabase, sql } from "../../config/db.js";

export default async function (fastify) {
  // Upload PDF: di Vercel, jangan jalankan RAG ingest sync (rawan timeout).
  fastify.post("/pdf", async (req, reply) => {
    try {
      const data = await req.file();

      if (!data) {
        return reply.code(400).send({
          status: "error",
          message: "File tidak ditemukan"
        });
      }

      const buffer = await data.toBuffer();

      // Upload ke Cloudinary
      const result = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            resource_type: "raw",
            folder: "documents",
            public_id: data.filename
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );

        stream.end(buffer);
      });

      if (process.env.VERCEL) {
        // Hindari FUNCTION_INVOCATION_TIMEOUT: proses RAG dijalankan terpisah.
        return reply.code(200).send({
          status: "uploaded",
          message:
            "File berhasil diupload ke Cloudinary. Di Vercel, proses RAG tidak dijalankan otomatis untuk menghindari timeout. Panggil POST /upload/pdf/rag untuk memproses RAG.",
          filename: data.filename,
          url: result.secure_url,
          public_id: result.public_id,
        });
      }

      // Proses RAG (extract + embedding + db)
      let processResult;
      try {
        processResult = await processPDF({
          fileBuffer: buffer,
          fileUrl: result.secure_url,
          title: data.filename
        });
      } catch (ragError) {
        // Upload berhasil tapi RAG gagal (timeout/model error)
        return reply.code(200).send({
          status: "partial",
          message:
            "File berhasil diupload ke Cloudinary, tapi proses RAG gagal. Kalau deploy di Vercel, pastikan MAIA_EMBED_MODEL sudah diset (remote embeddings), atau coba file lebih kecil/cek timeout.",
          filename: data.filename,
          url: result.secure_url,
          public_id: result.public_id,
          rag_error: ragError.message
        });
      }

      return {
        status: "success",
        filename: data.filename,
        url: result.secure_url,
        public_id: result.public_id,
        document_id: processResult.document_id,
        total_chunks: processResult.total_chunks
      };
    } catch (error) {
      return reply.code(500).send({
        status: "error",
        message: error.message || "Upload gagal",
        detail: error.toString()
      });
    }
  });

  // Proses RAG terpisah (bisa dipanggil dari local/worker).
  // Body: { url, title } atau { public_id, title }
  fastify.post("/pdf/rag", async (req, reply) => {
    try {
      const { url, public_id, title } = req.body || {};
      const fileUrl = url || (public_id ? cloudinary.url(public_id, { resource_type: "raw" }) : null);
      const docTitle = title || public_id || url;

      if (!fileUrl) {
        return reply.code(400).send({
          status: "error",
          message: "Mohon kirim `url` atau `public_id` di body",
        });
      }

      // Download ulang file (jangan bergantung buffer upload request sebelumnya)
      const res = await fetch(fileUrl);
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        return reply.code(400).send({
          status: "error",
          message: `Gagal download file: ${res.status}`,
          detail: text,
        });
      }

      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const processResult = await processPDF({
        fileBuffer: buffer,
        fileUrl,
        title: docTitle,
      });

      return reply.send({
        status: "success",
        url: fileUrl,
        public_id,
        document_id: processResult.document_id,
        total_chunks: processResult.total_chunks,
      });
    } catch (error) {
      return reply.code(500).send({
        status: "error",
        message: error.message || "Proses RAG gagal",
        detail: error.toString(),
      });
    }
  });

  // Debug helper: cek table dan (re)inisialisasi jika diperlukan.
  fastify.get("/db/status", async (req, reply) => {
    try {
      const databaseUrl = process.env.DATABASE_URL || null;
      let dbInfo = null;
      if (databaseUrl) {
        try {
          const u = new URL(databaseUrl);
          dbInfo = {
            host: u.host,
            database: (u.pathname || "").replace(/^\//, "") || null,
            sslmode: u.searchParams.get("sslmode"),
          };
        } catch {
          dbInfo = { host: null, database: null, sslmode: null };
        }
      }

      const [{ current_database } = {}] = await sql`SELECT current_database() as current_database;`;
      const [{ current_schema } = {}] = await sql`SELECT current_schema() as current_schema;`;
      const [{ exists } = {}] = await sql`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'document_chunks'
        ) as exists;
      `;

      return reply.send({
        status: "ok",
        db_info: dbInfo,
        database: current_database,
        schema: current_schema,
        document_chunks_exists: Boolean(exists),
      });
    } catch (error) {
      return reply.code(500).send({ status: "error", message: error.message });
    }
  });

  fastify.post("/db/init", async (req, reply) => {
    const embeddingDim = (() => {
      const explicit = Number(process.env.EMBEDDING_DIM);
      if (Number.isFinite(explicit) && explicit > 0) return explicit;
      const model = (process.env.MAIA_EMBED_MODEL || process.env.MAIA_MODEL || "").trim();
      if (model.includes("text-embedding-3")) return 1536;
      return 384;
    })();

    const steps = [];
    const runStep = async (name, fn) => {
      try {
        await fn();
        steps.push({ name, ok: true });
      } catch (err) {
        steps.push({ name, ok: false, error: err?.message || String(err) });
        throw err;
      }
    };

    try {
      // Best effort: run app-level init first
      await runStep("initDatabase()", () => initDatabase());

      // Hard-ensure table exists even if initDatabase is skipped/older deploy mismatch.
      await runStep("CREATE EXTENSION vector", () => sql`CREATE EXTENSION IF NOT EXISTS vector;`);
      await runStep("CREATE TABLE documents", () => sql`
        CREATE TABLE IF NOT EXISTS public.documents (
          id UUID PRIMARY KEY,
          title TEXT NOT NULL,
          file_url TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        );
      `);
      await runStep("CREATE TABLE document_chunks", () => sql.unsafe(`
        CREATE TABLE IF NOT EXISTS public.document_chunks (
          id UUID PRIMARY KEY,
          document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          chunk_index INTEGER NOT NULL,
          embedding VECTOR(${embeddingDim}),
          created_at TIMESTAMPTZ DEFAULT NOW(),
          UNIQUE(document_id, chunk_index)
        );
      `));

      const [{ exists } = {}] = await sql`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'document_chunks'
        ) as exists;
      `;

      const schemas = await sql`
        SELECT table_schema
        FROM information_schema.tables
        WHERE table_name = 'document_chunks'
        ORDER BY table_schema;
      `;

      if (exists) {
        await runStep("CREATE INDEX ivfflat", () => sql`
          CREATE INDEX IF NOT EXISTS idx_document_chunks_embedding
          ON public.document_chunks USING ivfflat (embedding vector_cosine_ops)
          WITH (lists = 100);
        `);
      } else {
        steps.push({ name: "CREATE INDEX ivfflat", ok: false, error: "document_chunks tidak ada (skip)" });
      }

      const [{ exists2 } = {}] = await sql`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'document_chunks'
        ) as exists2;
      `;

      return reply.send({
        status: "ok",
        embedding_dim: embeddingDim,
        document_chunks_exists: Boolean(exists2),
        document_chunks_schemas: schemas.map((r) => r.table_schema),
        steps,
      });
    } catch (error) {
      return reply.code(500).send({
        status: "error",
        message: error.message,
        embedding_dim: embeddingDim,
        steps,
      });
    }
  });
}
