import {
  cancelRegistrationService,
  createProgramService,
  getProgramDetailService,
  listParticipantsService,
  listProgramsService,
  registerParticipantService,
  softDeleteProgramService,
  updateParticipantStatusService,
  updateProgramService,
} from "../service/program.service.js";

const PROGRAM_TYPES = ["vaksinasi", "penyuluhan", "pemeriksaan", "olahraga"];
const PROGRAM_STATUS = ["aktif", "nonaktif", "selesai"];
const PARTICIPANT_STATUS = ["menunggu", "diterima", "ditolak"];

export async function createProgramController(req, reply) {
  try {
    const payload = req.body || {};

    const required = [
      "nama",
      "type",
      "tanggal_mulai",
      "tanggal_selesai",
      "kuota",
      "status",
    ];

    for (const key of required) {
      if (payload[key] === undefined || payload[key] === null || payload[key] === "") {
        return reply.code(400).send({ success: false, message: `Field '${key}' wajib diisi` });
      }
    }

    if (!PROGRAM_TYPES.includes(payload.type)) {
      return reply.code(400).send({ success: false, message: "Type program tidak valid" });
    }
    if (!PROGRAM_STATUS.includes(payload.status)) {
      return reply.code(400).send({ success: false, message: "Status program tidak valid" });
    }

    const program = await createProgramService(payload);
    return reply.code(201).send({
      success: true,
      message: "Program berhasil dibuat",
      data: program,
    });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
}

export async function listProgramsController(req, reply) {
  try {
    const data = await listProgramsService(req.query || {});
    return reply.code(200).send({
      success: true,
      message: "Menampilkan list program",
      data,
    });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
}

export async function getProgramDetailController(req, reply) {
  try {
    const { id } = req.params || {};
    const data = await getProgramDetailService(id);

    if (!data) {
      return reply.code(404).send({ success: false, message: "Program tidak ditemukan" });
    }

    return reply.code(200).send({
      success: true,
      message: "Detail program",
      data,
    });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
}

export async function updateProgramController(req, reply) {
  try {
    const { id } = req.params || {};
    const payload = req.body || {};

    if ("type" in payload && payload.type !== undefined && !PROGRAM_TYPES.includes(payload.type)) {
      return reply.code(400).send({ success: false, message: "Type program tidak valid" });
    }
    if ("status" in payload && payload.status !== undefined && !PROGRAM_STATUS.includes(payload.status)) {
      return reply.code(400).send({ success: false, message: "Status program tidak valid" });
    }

    const updated = await updateProgramService(id, payload);

    if (!updated) {
      return reply.code(404).send({ success: false, message: "Program tidak ditemukan" });
    }

    return reply.code(200).send({
      success: true,
      message: "Program berhasil diupdate",
      data: updated,
    });
  } catch (error) {
    const msg = error.message || "Terjadi kesalahan";
    if (msg.includes("Tidak ada field")) {
      return reply.code(400).send({ success: false, message: msg });
    }
    return reply.code(500).send({ success: false, message: msg });
  }
}

export async function deleteProgramController(req, reply) {
  try {
    const { id } = req.params || {};
    const deleted = await softDeleteProgramService(id);

    if (!deleted) {
      return reply.code(404).send({ success: false, message: "Program tidak ditemukan" });
    }

    return reply.code(200).send({
      success: true,
      message: "Program berhasil dihapus",
      data: deleted,
    });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
}

export async function registerParticipantController(req, reply) {
  try {
    const { id } = req.params || {};
    const payload = req.body || {};

    if (!payload.pasien_id) {
      return reply.code(400).send({ success: false, message: "Field 'pasien_id' wajib diisi" });
    }

    const data = await registerParticipantService({
      program_id: id,
      pasien_id: payload.pasien_id,
    });

    return reply.code(201).send({
      success: true,
      message: "Berhasil mendaftar sebagai peserta",
      data,
    });
  } catch (error) {
    const msg = error.message || "Terjadi kesalahan";
    if (msg.includes("tidak ditemukan")) return reply.code(404).send({ success: false, message: msg });
    if (msg.includes("sudah terdaftar")) return reply.code(409).send({ success: false, message: msg });
    if (msg.includes("Kuota penuh") || msg.includes("tidak aktif")) return reply.code(400).send({ success: false, message: msg });
    return reply.code(500).send({ success: false, message: msg });
  }
}

export async function cancelRegistrationController(req, reply) {
  try {
    const { id, pasien_id } = req.params || {};
    const data = await cancelRegistrationService({ program_id: id, pasien_id });

    if (!data) {
      return reply.code(404).send({ success: false, message: "Pendaftaran tidak ditemukan" });
    }

    return reply.code(200).send({
      success: true,
      message: "Pendaftaran berhasil dibatalkan",
      data,
    });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
}

export async function listParticipantsController(req, reply) {
  try {
    const { id } = req.params || {};
    const data = await listParticipantsService(id, req.query || {});

    return reply.code(200).send({
      success: true,
      message: "Menampilkan list peserta",
      data,
    });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
}

export async function updateParticipantStatusController(req, reply) {
  try {
    const { id, pasien_id } = req.params || {};
    const payload = req.body || {};

    if (!payload.status) {
      return reply.code(400).send({ success: false, message: "Field 'status' wajib diisi" });
    }
    if (!PARTICIPANT_STATUS.includes(payload.status)) {
      return reply.code(400).send({ success: false, message: "Status peserta tidak valid" });
    }

    const data = await updateParticipantStatusService({
      program_id: id,
      pasien_id,
      status: payload.status,
    });

    if (!data) {
      return reply.code(404).send({ success: false, message: "Peserta tidak ditemukan" });
    }

    return reply.code(200).send({
      success: true,
      message: "Status peserta berhasil diupdate",
      data,
    });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
}
