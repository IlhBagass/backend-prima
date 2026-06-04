import {
  createConsultationService,
  getConsultationByIdService,
  listConsultationsByDoctorService,
  listConsultationsByPasienService,
  listMessagesService,
  markMessagesReadService,
  sendMessageService,
  softDeleteConsultationService,
  updateConsultationStatusService,
} from "../service/consultation.service.js";
import { uploadBufferToCloudinary } from "../../../utils/upload.js";

const CONSULTATION_STATUS = ["aktif", "selesai", "dibatalkan"];
const MESSAGE_TYPES = ["text", "file", "image"];

export async function createConsultationController(req, reply) {
  try {
    const payload = req.body || {};
    const required = ["pasien_id", "doctor_id"];
    for (const key of required) {
      if (!payload[key]) {
        return reply.code(400).send({ success: false, message: `Field '${key}' wajib diisi` });
      }
    }

    const data = await createConsultationService(payload);
    return reply.code(201).send({
      success: true,
      message: "Room konsultasi berhasil dibuat",
      data,
    });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
}

export async function listConsultationsByPasienController(req, reply) {
  try {
    const { pasien_id } = req.params || {};
    const { status, limit, offset } = req.query || {};
    const data = await listConsultationsByPasienService(pasien_id, { status, limit, offset });
    return reply.code(200).send({ success: true, message: "List konsultasi pasien", data });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
}

export async function listConsultationsByDoctorController(req, reply) {
  try {
    const { doctor_id } = req.params || {};
    const { status, limit, offset } = req.query || {};
    const data = await listConsultationsByDoctorService(doctor_id, { status, limit, offset });
    return reply.code(200).send({ success: true, message: "List konsultasi dokter", data });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
}

export async function getConsultationDetailController(req, reply) {
  try {
    const { id } = req.params || {};
    const data = await getConsultationByIdService(id);
    if (!data) {
      return reply.code(404).send({ success: false, message: "Konsultasi tidak ditemukan" });
    }
    return reply.code(200).send({ success: true, message: "Detail konsultasi", data });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
}

export async function updateConsultationStatusController(req, reply) {
  try {
    const { id } = req.params || {};
    const payload = req.body || {};

    if (!payload.status) {
      return reply.code(400).send({ success: false, message: "Field 'status' wajib diisi" });
    }
    if (!CONSULTATION_STATUS.includes(payload.status)) {
      return reply.code(400).send({ success: false, message: "Status konsultasi tidak valid" });
    }

    const data = await updateConsultationStatusService(id, payload.status);
    if (!data) {
      return reply.code(404).send({ success: false, message: "Konsultasi tidak ditemukan" });
    }

    return reply.code(200).send({
      success: true,
      message: "Status konsultasi berhasil diupdate",
      data,
    });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
}

export async function deleteConsultationController(req, reply) {
  try {
    const { id } = req.params || {};
    const data = await softDeleteConsultationService(id);
    if (!data) {
      return reply.code(404).send({ success: false, message: "Konsultasi tidak ditemukan" });
    }
    return reply.code(200).send({ success: true, message: "Konsultasi berhasil dihapus", data });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
}

export async function sendMessageController(req, reply) {
  try {
    const { id } = req.params || {};
    const payload = req.body || {};

    const required = ["sender_id", "type"];
    for (const key of required) {
      if (!payload[key]) {
        return reply.code(400).send({ success: false, message: `Field '${key}' wajib diisi` });
      }
    }
    if (!MESSAGE_TYPES.includes(payload.type)) {
      return reply.code(400).send({ success: false, message: "Type pesan tidak valid" });
    }
    if (payload.type === "text" && !payload.message) {
      return reply.code(400).send({ success: false, message: "Field 'message' wajib diisi untuk type text" });
    }

    const data = await sendMessageService({
      consultation_id: id,
      sender_id: payload.sender_id,
      message: payload.message ?? null,
      file_url: payload.file_url ?? null,
      type: payload.type,
    });

    return reply.code(201).send({ success: true, message: "Pesan terkirim", data });
  } catch (error) {
    const msg = error.message || "Terjadi kesalahan";
    if (msg.includes("tidak ditemukan")) return reply.code(404).send({ success: false, message: msg });
    return reply.code(500).send({ success: false, message: msg });
  }
}

export async function listMessagesController(req, reply) {
  try {
    const { id } = req.params || {};
    const { limit, offset } = req.query || {};
    const data = await listMessagesService(id, { limit, offset });
    return reply.code(200).send({ success: true, message: "List pesan", data });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
}

export async function markMessagesReadController(req, reply) {
  try {
    const { id } = req.params || {};
    const payload = req.body || {};
    if (!payload.user_id) {
      return reply.code(400).send({ success: false, message: "Field 'user_id' wajib diisi" });
    }

    const data = await markMessagesReadService({ consultation_id: id, user_id: payload.user_id });
    return reply.code(200).send({ success: true, message: "Pesan ditandai dibaca", data });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
}

export async function uploadChatFileController(req, reply) {
  try {
    const { id } = req.params || {};

    const consultation = await getConsultationByIdService(id);
    if (!consultation) {
      return reply.code(404).send({ success: false, message: "Konsultasi tidak ditemukan" });
    }

    const file = await req.file();
    if (!file) {
      return reply.code(400).send({ success: false, message: "File tidak ditemukan" });
    }

    const buffer = await file.toBuffer();
    const safeName = String(file.filename || "file").replace(/[^\w.\-]+/g, "_");
    const filename = `${id}-${Date.now()}-${safeName}`;

    const upload = await uploadBufferToCloudinary({
      buffer,
      filename,
      folder: "consultations",
      resourceType: "auto",
    });

    return reply.code(201).send({
      success: true,
      message: "File berhasil diupload",
      data: {
        consultation_id: id,
        file_url: upload.secure_url,
        public_id: upload.public_id,
        original_filename: file.filename,
        mimetype: file.mimetype,
      },
    });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
}

