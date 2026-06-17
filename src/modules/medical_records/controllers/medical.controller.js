import {
  createMedicalRecord,
  getMedicalRecordsByPasien,
  getMedicalRecordDetail,
  getMedicalRecordsByDoctor,
  updateMedicalRecord,
  deleteMedicalRecord,
} from "../service/medical.service.js";

export async function createMedicalRecordController(req, reply) {
  try {
    const data = await createMedicalRecord(req.body);

    return reply.code(201).send({
      success: true,
      message: "Rekam medis berhasil dibuat",
      data,
    });
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: error.message,
    });
  }
}

export async function getMedicalRecordsByPasienController(req, reply) {
  try {
    const { pasien_id } = req.params;

    const data = await getMedicalRecordsByPasien({
      pasien_id,
      ...req.query,
    });

    return reply.send({
      success: true,
      data,
    });
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: error.message,
    });
  }
}

export async function getMedicalRecordsByDoctorController(req, reply) {
  try {
    const { doctor_id } = req.params;

    const data = await getMedicalRecordsByDoctor({
      doctor_id,
      ...req.query,
    });

    return reply.send({
      success: true,
      data,
    });
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: error.message,
    });
  }
}

export async function getMedicalRecordDetailController(req, reply) {
  try {
    const data = await getMedicalRecordDetail(req.params.id);

    if (!data) {
      return reply.code(404).send({
        success: false,
        message: "Rekam medis tidak ditemukan",
      });
    }

    return reply.send({
      success: true,
      data,
    });
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: error.message,
    });
  }
}

export async function updateMedicalRecordController(req, reply) {
  try {
    const data = await updateMedicalRecord(
      req.params.id,
      req.body
    );

    if (!data) {
      return reply.code(404).send({
        success: false,
        message: "Rekam medis tidak ditemukan",
      });
    }

    return reply.send({
      success: true,
      message: "Rekam medis berhasil diupdate",
      data,
    });
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: error.message,
    });
  }
}

export async function deleteMedicalRecordController(req, reply) {
  try {
    const data = await deleteMedicalRecord(req.params.id);

    if (!data) {
      return reply.code(404).send({
        success: false,
        message: "Rekam medis tidak ditemukan",
      });
    }

    return reply.send({
      success: true,
      message: "Rekam medis berhasil dihapus",
    });
  } catch (error) {
    return reply.code(500).send({
      success: false,
      message: error.message,
    });
  }
}