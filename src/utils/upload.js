import cloudinary from "../config/cloudinary.js";

export const uploadBufferToCloudinary = async ({
  buffer,
  filename,
  folder,
  resourceType = "image",
}) => {
  if (!buffer) {
    throw new Error("Buffer file tidak ada");
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: resourceType,
        folder,
        public_id: filename,
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    stream.end(buffer);
  });
};
