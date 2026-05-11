import {
  createBookingService,
  deleteBookingByIdService,
  getBookingByIdService,
  listBookingsByDoctorService,
  listBookingsByUserService,
  updateBookingByIdService,
} from "../service/booking.service.js";

const isValidTime = (value) => typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value);
const isValidDate = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

export const createBooking = async (req, reply) => {
  try {
    const { doctor_id, pasien_id, appointment_date, start_time, end_time, notes } = req.body || {};

    if (!doctor_id) return reply.code(400).send({ success: false, message: "doctor_id wajib diisi" });
    if (!pasien_id) return reply.code(400).send({ success: false, message: "pasien_id wajib diisi" });
    if (!isValidDate(appointment_date)) {
      return reply.code(400).send({ success: false, message: "appointment_date wajib format YYYY-MM-DD" });
    }
    if (!isValidTime(start_time) || !isValidTime(end_time)) {
      return reply.code(400).send({ success: false, message: "start_time/end_time wajib format HH:MM atau HH:MM:SS" });
    }

    const data = await createBookingService({
      doctor_id,
      pasien_id,
      appointment_date,
      start_time,
      end_time,
      notes,
    });

    return reply.code(201).send({ success: true, message: "Booking berhasil dibuat", data });
  } catch (error) {
    return reply.code(400).send({ success: false, message: error.message });
  }
};

export const getBookingById = async (req, reply) => {
  try {
    const { id } = req.params;
    const data = await getBookingByIdService(id);
    if (!data) return reply.code(404).send({ success: false, message: "Booking tidak ditemukan" });
    return reply.send({ success: true, data });
  } catch (error) {
    return reply.code(400).send({ success: false, message: error.message });
  }
};

export const listBookingsByDoctor = async (req, reply) => {
  try {
    const { doctor_id } = req.params;
    const { date, status } = req.query || {};
    const data = await listBookingsByDoctorService({ doctorId: doctor_id, date, status });
    return reply.send({ success: true, data });
  } catch (error) {
    return reply.code(400).send({ success: false, message: error.message });
  }
};

export const listBookingsByUser = async (req, reply) => {
  try {
    const { user_id } = req.params;
    const { date, status } = req.query || {};
    const data = await listBookingsByUserService({ userId: user_id, date, status });
    return reply.send({ success: true, data });
  } catch (error) {
    return reply.code(400).send({ success: false, message: error.message });
  }
};

export const updateBookingById = async (req, reply) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};

    if ("appointment_date" in payload && payload.appointment_date !== undefined && !isValidDate(payload.appointment_date)) {
      return reply.code(400).send({ success: false, message: "appointment_date wajib format YYYY-MM-DD" });
    }
    if ("start_time" in payload && payload.start_time !== undefined && !isValidTime(payload.start_time)) {
      return reply.code(400).send({ success: false, message: "start_time wajib format HH:MM atau HH:MM:SS" });
    }
    if ("end_time" in payload && payload.end_time !== undefined && !isValidTime(payload.end_time)) {
      return reply.code(400).send({ success: false, message: "end_time wajib format HH:MM atau HH:MM:SS" });
    }

    const data = await updateBookingByIdService(id, payload);
    if (!data) return reply.code(404).send({ success: false, message: "Booking tidak ditemukan" });
    return reply.send({ success: true, message: "Booking berhasil diupdate", data });
  } catch (error) {
    return reply.code(400).send({ success: false, message: error.message });
  }
};

export const deleteBookingById = async (req, reply) => {
  try {
    const { id } = req.params;
    const data = await deleteBookingByIdService(id);
    if (!data) return reply.code(404).send({ success: false, message: "Booking tidak ditemukan" });
    return reply.send({ success: true, message: "Booking berhasil dihapus", data });
  } catch (error) {
    return reply.code(400).send({ success: false, message: error.message });
  }
};

