import {
  deleteNotificationByIdService,
  getNotificationByIdService,
  listNotificationsByUserService,
  markAllNotificationsReadByUserService,
  markNotificationReadByIdService,
} from "../service/notification.service.js";

const parseBool = (v) => {
  if (v === true || v === false) return v;
  if (typeof v !== "string") return undefined;
  const s = v.toLowerCase();
  if (s === "true" || s === "1") return true;
  if (s === "false" || s === "0") return false;
  return undefined;
};

export const listNotificationsByUserController = async (req, reply) => {
  try {
    const { user_id } = req.params || {};
    const { is_read, type, limit, offset } = req.query || {};
    const parsedIsRead = parseBool(is_read);

    const data = await listNotificationsByUserService(user_id, {
      is_read: parsedIsRead,
      type,
      limit,
      offset,
    });

    return reply.code(200).send({ success: true, data });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
};

export const getNotificationDetailController = async (req, reply) => {
  try {
    const { id } = req.params || {};
    const data = await getNotificationByIdService(id);
    if (!data) {
      return reply.code(404).send({ success: false, message: "Notifikasi tidak ditemukan" });
    }
    return reply.code(200).send({ success: true, data });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
};

export const markOneReadController = async (req, reply) => {
  try {
    const { id } = req.params || {};
    const data = await markNotificationReadByIdService(id);
    if (!data) {
      return reply.code(404).send({ success: false, message: "Notifikasi tidak ditemukan" });
    }
    return reply.code(200).send({ success: true, data });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
};

export const markAllReadController = async (req, reply) => {
  try {
    const { user_id } = req.params || {};
    const data = await markAllNotificationsReadByUserService(user_id);
    return reply.code(200).send({ success: true, data });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
};

export const deleteNotificationController = async (req, reply) => {
  try {
    const { id } = req.params || {};
    const data = await deleteNotificationByIdService(id);
    if (!data) {
      return reply.code(404).send({ success: false, message: "Notifikasi tidak ditemukan" });
    }
    return reply.code(200).send({ success: true, message: "Notifikasi berhasil dihapus", data });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
};

