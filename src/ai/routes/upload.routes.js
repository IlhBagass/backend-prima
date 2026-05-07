import cloudinary from "../../config/cloudinary.js";
import { processPDF } from "../rag/ingest.js";

export default async function (fastify) {
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
          message: "File berhasil diupload ke Cloudinary, tapi proses RAG gagal. Coba endpoint /upload/pdf lagi dengan file yang lebih kecil, atau cek Vercel timeout.",
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
}