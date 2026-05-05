import cloudinary from "../../config/cloudinary.js";
import { processPDF } from "../rag/ingest.js";

export default async function (fastify) {
  fastify.post("/pdf", async (req, reply) => {
    const data = await req.file();

    if (!data) {
      return reply.code(400).send({
        status: "error",
        message: "File tidak ditemukan"
      });
    }

    const buffer = await data.toBuffer();

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          resource_type: "image",
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

    const processResult = await processPDF({
      fileBuffer: buffer,
      fileUrl: result.secure_url,
      title: data.filename
    });


    return {
      status: "success",
      filename: data.filename,
      url: result.secure_url,
      public_id: result.public_id,
      document_id: processResult.document_id,
      total_chunks: processResult.total_chunks
    };
  });
}