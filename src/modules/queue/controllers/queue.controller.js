import {
  callNextQueueService,
  getQueuePositionByBookingService,
  getTodayQueueByDoctorService,
  updateQueueStatusService,
} from "../service/queue.service.js";

const QUEUE_STATUS = ["menunggu", "dipanggil", "selesai", "tidak_hadir"];

export const getQueuePositionByBookingController = async (req, reply) => {
  try {
    const { booking_id } = req.params || {};
    const data = await getQueuePositionByBookingService(booking_id);
    if (!data) {
      return reply.code(404).send({ success: false, message: "Booking tidak ditemukan" });
    }
    return reply.code(200).send({ success: true, data });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
};

export const getTodayQueueByDoctorController = async (req, reply) => {
  try {
    const { doctor_id } = req.params || {};
    const data = await getTodayQueueByDoctorService(doctor_id);
    return reply.code(200).send({ success: true, data });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
};

export const callNextPatientController = async (req, reply) => {
  try {
    const { doctor_id } = req.params || {};
    const data = await callNextQueueService(doctor_id);
    if (!data) {
      return reply.code(404).send({ success: false, message: "Tidak ada antrian menunggu untuk dipanggil" });
    }
    return reply.code(200).send({ success: true, data });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
};

export const updateQueueStatusController = async (req, reply) => {
  try {
    const { booking_id } = req.params || {};
    const payload = req.body || {};

    if (!payload.status) {
      return reply.code(400).send({ success: false, message: "Field 'status' wajib diisi" });
    }
    if (!QUEUE_STATUS.includes(payload.status)) {
      return reply.code(400).send({
        success: false,
        message: "Status tidak valid. Pilihan: menunggu | dipanggil | selesai | tidak_hadir",
      });
    }

    const data = await updateQueueStatusService(booking_id, payload.status);
    if (!data) {
      return reply.code(404).send({ success: false, message: "Booking tidak ditemukan" });
    }

    return reply.code(200).send({ success: true, data });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
};

