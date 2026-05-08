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
      const [{ current_database } = {}] = await sql`SELECT current_database() as current_database;`;
      const [{ exists } = {}] = await sql`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'document_chunks'
        ) as exists;
      `;

      return reply.send({
        status: "ok",
        database: current_database,
        document_chunks_exists: Boolean(exists),
      });
    } catch (error) {
      return reply.code(500).send({ status: "error", message: error.message });
    }
  });

  fastify.post("/db/init", async (req, reply) => {
    try {
      await initDatabase();
      const [{ exists } = {}] = await sql`
        SELECT EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = 'document_chunks'
        ) as exists;
      `;
      return reply.send({ status: "ok", document_chunks_exists: Boolean(exists) });
    } catch (error) {
      return reply.code(500).send({ status: "error", message: error.message });
    }
  });
}
