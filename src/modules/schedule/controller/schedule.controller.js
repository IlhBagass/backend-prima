import {
  createScheduleService,
  deleteScheduleByIdService,
  listSchedulesByDoctorAndDayService,
  listSchedulesByDoctorService,
  updateScheduleByIdService,
} from "../service/schedule.service.js";
import { listBookingsByDoctorDateService } from "../service/booking.service.js";

const isValidDayOfWeek = (value) => Number.isInteger(value) && value >= 0 && value <= 6;
const isValidTime = (value) => typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/.test(value);

const toMinutes = (time) => {
  const parts = String(time).split(":").map((p) => Number(p));
  const [h, m] = parts;
  return h * 60 + m;
};

const parseDateParam = (dateStr) => {
  if (typeof dateStr !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  // Interpret input date as "local date" (bukan UTC) supaya mapping day_of_week sesuai ekspektasi user saat testing lokal.
  // Format: YYYY-MM-DD
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

export const createSchedule = async (req, reply) => {
  try {
    const { doctor_id, day_of_week, start_time, end_time } = req.body || {};

    if (!doctor_id) {
      return reply.code(400).send({ success: false, message: "doctor_id wajib diisi" });
    }

    const dayInt = Number(day_of_week);
    if (!Number.isFinite(dayInt) || !isValidDayOfWeek(dayInt)) {
      return reply.code(400).send({ success: false, message: "day_of_week harus integer 0-6 (0=Minggu)" });
    }

    if (!isValidTime(start_time) || !isValidTime(end_time)) {
      return reply.code(400).send({
        success: false,
        message: "start_time dan end_time wajib format HH:MM atau HH:MM:SS",
      });
    }

    if (toMinutes(start_time) >= toMinutes(end_time)) {
      return reply.code(400).send({ success: false, message: "start_time harus lebih kecil dari end_time" });
    }

    const data = await createScheduleService({
      doctor_id,
      day_of_week: dayInt,
      start_time,
      end_time,
    });

    return reply.code(201).send({ success: true, message: "Jadwal berhasil dibuat", data });
  } catch (error) {
    return reply.code(400).send({ success: false, message: error.message });
  }
};

export const getSchedulesByDoctor = async (req, reply) => {
  try {
    const { doctor_id } = req.params;
    const data = await listSchedulesByDoctorService(doctor_id);
    return reply.send({ success: true, data });
  } catch (error) {
    return reply.code(400).send({ success: false, message: error.message });
  }
};

export const getAvailableSchedulesByDoctor = async (req, reply) => {
  try {
    const { doctor_id } = req.params;
    const { date } = req.query || {};

    const parsed = parseDateParam(date);
    if (!parsed) {
      return reply.code(400).send({ success: false, message: "Query date wajib format YYYY-MM-DD" });
    }

    const dayOfWeek = parsed.getDay(); // 0=Sunday (local)
    const schedules = await listSchedulesByDoctorAndDayService({ doctorId: doctor_id, dayOfWeek });
    const bookings = await listBookingsByDoctorDateService({ doctorId: doctor_id, date });

    return reply.send({
      success: true,
      data: {
        doctor_id,
        date,
        day_of_week: dayOfWeek,
        schedules,
        bookings,
      },
    });
  } catch (error) {
    return reply.code(400).send({ success: false, message: error.message });
  }
};

export const updateScheduleById = async (req, reply) => {
  try {
    const { id } = req.params;
    const payload = req.body || {};

    if ("day_of_week" in payload && payload.day_of_week !== undefined) {
      const dayInt = Number(payload.day_of_week);
      if (!Number.isFinite(dayInt) || !isValidDayOfWeek(dayInt)) {
        return reply.code(400).send({ success: false, message: "day_of_week harus integer 0-6 (0=Minggu)" });
      }
      payload.day_of_week = dayInt;
    }

    if ("start_time" in payload && payload.start_time !== undefined && !isValidTime(payload.start_time)) {
      return reply.code(400).send({ success: false, message: "start_time harus format HH:MM atau HH:MM:SS" });
    }
    if ("end_time" in payload && payload.end_time !== undefined && !isValidTime(payload.end_time)) {
      return reply.code(400).send({ success: false, message: "end_time harus format HH:MM atau HH:MM:SS" });
    }

    if (payload.start_time && payload.end_time && toMinutes(payload.start_time) >= toMinutes(payload.end_time)) {
      return reply.code(400).send({ success: false, message: "start_time harus lebih kecil dari end_time" });
    }

    const data = await updateScheduleByIdService(id, payload);
    if (!data) {
      return reply.code(404).send({ success: false, message: "Jadwal tidak ditemukan" });
    }
    return reply.send({ success: true, message: "Jadwal berhasil diupdate", data });
  } catch (error) {
    return reply.code(400).send({ success: false, message: error.message });
  }
};

export const deleteScheduleById = async (req, reply) => {
  try {
    const { id } = req.params;
    const data = await deleteScheduleByIdService(id);
    if (!data) {
      return reply.code(404).send({ success: false, message: "Jadwal tidak ditemukan" });
    }
    return reply.send({ success: true, message: "Jadwal berhasil dihapus", data });
  } catch (error) {
    return reply.code(400).send({ success: false, message: error.message });
  }
};
