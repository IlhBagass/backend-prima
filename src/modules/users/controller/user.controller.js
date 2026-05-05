import {
  deleteUserByIdService,
  hardDeleteUserByIdService,
  getUserByIdService,
  listUsersService,
  updateUserProfilePhotoUrlService,
  updateUserByIdService,
} from "../service/user.service.js";
import { uploadBufferToCloudinary } from "../../../utils/upload.js";

export const listUsers = async (req, reply) => {
  try {
    const { limit, offset, role, status } = req.query || {};
    const data = await listUsersService({ limit, offset, role, status });
    return reply.send({ success: true, data });
  } catch (error) {
    return reply.code(400).send({ success: false, message: error.message });
  }
};

export const getUserById = async (req, reply) => {
  try {
    const { id } = req.params;
    const data = await getUserByIdService(id);
    if (!data) {
      return reply.code(404).send({ success: false, message: "User tidak ditemukan" });
    }
    return reply.send({ success: true, data });
  } catch (error) {
    return reply.code(400).send({ success: false, message: error.message });
  }
};

export const updateUserById = async (req, reply) => {
  try {
    const { id } = req.params;
    const data = await updateUserByIdService(id, req.body || {});
    if (!data) {
      return reply.code(404).send({ success: false, message: "User tidak ditemukan" });
    }
    return reply.send({ success: true, message: "User berhasil diupdate", data });
  } catch (error) {
    return reply.code(400).send({ success: false, message: error.message });
  }
};

export const deleteUserById = async (req, reply) => {
  try {
    const { id } = req.params;
    const data = await deleteUserByIdService(id);
    if (!data) {
      return reply.code(404).send({ success: false, message: "User tidak ditemukan" });
    }
    return reply.send({ success: true, message: "User berhasil dihapus", data });
  } catch (error) {
    return reply.code(400).send({ success: false, message: error.message });
  }
};

export const hardDeleteUserById = async (req, reply) => {
  try {
    const { id } = req.params;
    const data = await hardDeleteUserByIdService(id);
    if (!data) {
      return reply.code(404).send({ success: false, message: "User tidak ditemukan" });
    }
    return reply.send({ success: true, message: "User berhasil dihapus permanen", data });
  } catch (error) {
    return reply.code(400).send({ success: false, message: error.message });
  }
};

export const uploadUserProfilePhoto = async (req, reply) => {
  try {
    const { id } = req.params;

    const user = await getUserByIdService(id);
    if (!user) {
      return reply.code(404).send({ success: false, message: "User tidak ditemukan" });
    }

    const file = await req.file();
    if (!file) {
      return reply.code(400).send({ success: false, message: "File tidak ditemukan" });
    }

    const buffer = await file.toBuffer();
    const folder = `profiles/${user.role || "users"}`;
    const filename = `${id}-${Date.now()}`;

    const upload = await uploadBufferToCloudinary({
      buffer,
      filename,
      folder,
      resourceType: "image",
    });

    const updated = await updateUserProfilePhotoUrlService(id, upload.secure_url);
    return reply.send({
      success: true,
      message: "Foto profil berhasil diupload",
      data: {
        id: updated?.id || id,
        role: updated?.role || user.role,
        foto_profil_url: upload.secure_url,
        public_id: upload.public_id,
      },
    });
  } catch (error) {
    return reply.code(400).send({ success: false, message: error.message });
  }
};
