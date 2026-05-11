import { sql } from "../../../config/db.js";
import { listSchedulesByDoctorAndDayService } from "./schedule.service.js";

const normalizeTimeToMinutes = (time) => {
  if (typeof time !== "string") return null;
  const parts = time.split(":").map((p) => Number(p));
  if (parts.length < 2) return null;
  const [h, m] = parts;
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return h * 60 + m;
};

const parseDateParam = (dateStr) => {
  if (typeof dateStr !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const date = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const findBookingConflictByDoctor = async ({ doctorId, date, startTime, endTime, excludeId }) => {
  const params = [doctorId, date, startTime, endTime];
  let excludeSql = "";
  if (excludeId) {
    params.push(excludeId);
    excludeSql = `AND id <> $${params.length}`;
  }

  const rows = await sql.query(
    `
      SELECT id, doctor_id, pasien_id, appointment_date, start_time, end_time, status
      FROM public.appointments
      WHERE doctor_id = $1
        AND appointment_date = $2
        AND status <> 'cancelled'
        AND NOT (end_time <= $3 OR start_time >= $4)
        ${excludeSql}
      LIMIT 1
    `,
    params
  );

  return rows[0] || null;
};

const ensureWithinDoctorSchedule = async ({ doctorId, dateStr, startTime, endTime }) => {
  const parsed = parseDateParam(dateStr);
  if (!parsed) throw new Error("appointment_date wajib format YYYY-MM-DD");
  const dayOfWeek = parsed.getDay(); // 0=Sunday

  const schedules = await listSchedulesByDoctorAndDayService({ doctorId, dayOfWeek });
  if (!Array.isArray(schedules) || schedules.length === 0) {
    throw new Error("Dokter tidak punya jadwal praktik pada tanggal tersebut");
  }

  const startMin = normalizeTimeToMinutes(startTime);
  const endMin = normalizeTimeToMinutes(endTime);
  if (startMin === null || endMin === null) throw new Error("start_time/end_time wajib format HH:MM atau HH:MM:SS");
  if (startMin >= endMin) throw new Error("start_time harus lebih kecil dari end_time");

  for (const s of schedules) {
    const blockStart = normalizeTimeToMinutes(String(s.start_time));
    const blockEnd = normalizeTimeToMinutes(String(s.end_time));
    if (blockStart === null || blockEnd === null) continue;
    if (startMin >= blockStart && endMin <= blockEnd) {
      return { schedule: s, day_of_week: dayOfWeek };
    }
  }

  throw new Error("Waktu booking di luar jam praktik dokter");
};

export const createBookingService = async ({
  doctor_id,
  pasien_id,
  appointment_date,
  start_time,
  end_time,
  notes,
}) => {
  const { schedule } = await ensureWithinDoctorSchedule({
    doctorId: doctor_id,
    dateStr: appointment_date,
    startTime: start_time,
    endTime: end_time,
  });

  const conflict = await findBookingConflictByDoctor({
    doctorId: doctor_id,
    date: appointment_date,
    startTime: start_time,
    endTime: end_time,
  });
  if (conflict) {
    throw new Error(`Slot sudah dibooking (conflict_id=${conflict.id})`);
  }

  const rows = await sql.query(
    `
      INSERT INTO public.appointments (
        doctor_id, pasien_id, schedule_id,
        appointment_date, start_time, end_time,
        status, notes, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, 'booked', $7, NOW())
      RETURNING id, doctor_id, pasien_id, schedule_id, appointment_date, start_time, end_time, status, notes, created_at, updated_at
    `,
    [doctor_id, pasien_id, schedule.id, appointment_date, start_time, end_time, notes ?? null]
  );

  return rows[0] || null;
};

export const listBookingsByDoctorService = async ({ doctorId, date, status } = {}) => {
  const where = ["doctor_id = $1"];
  const params = [doctorId];

  if (date) {
    params.push(date);
    where.push(`appointment_date = $${params.length}`);
  }
  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }

  return sql.query(
    `
      SELECT id, doctor_id, pasien_id, schedule_id, appointment_date, start_time, end_time, status, notes, created_at, updated_at, cancelled_at
      FROM public.appointments
      WHERE ${where.join(" AND ")}
      ORDER BY appointment_date DESC, start_time ASC
    `,
    params
  );
};

export const listBookingsByUserService = async ({ userId, date, status } = {}) => {
  const where = ["pasien_id = $1"];
  const params = [userId];

  if (date) {
    params.push(date);
    where.push(`appointment_date = $${params.length}`);
  }
  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }

  return sql.query(
    `
      SELECT id, doctor_id, pasien_id, schedule_id, appointment_date, start_time, end_time, status, notes, created_at, updated_at, cancelled_at
      FROM public.appointments
      WHERE ${where.join(" AND ")}
      ORDER BY appointment_date DESC, start_time ASC
    `,
    params
  );
};

export const getBookingByIdService = async (id) => {
  const rows = await sql.query(
    `
      SELECT id, doctor_id, pasien_id, schedule_id, appointment_date, start_time, end_time, status, notes, created_at, updated_at, cancelled_at
      FROM public.appointments
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );
  return rows[0] || null;
};

export const updateBookingByIdService = async (id, payload = {}) => {
  const current = await getBookingByIdService(id);
  if (!current) return null;

  const next = {
    appointment_date:
      "appointment_date" in payload && payload.appointment_date !== undefined
        ? payload.appointment_date
        : current.appointment_date,
    start_time:
      "start_time" in payload && payload.start_time !== undefined ? payload.start_time : current.start_time,
    end_time: "end_time" in payload && payload.end_time !== undefined ? payload.end_time : current.end_time,
    notes: "notes" in payload && payload.notes !== undefined ? payload.notes : current.notes,
    status: "status" in payload && payload.status !== undefined ? payload.status : current.status,
  };

  const timeOrDateChanged =
    next.appointment_date !== current.appointment_date ||
    String(next.start_time) !== String(current.start_time) ||
    String(next.end_time) !== String(current.end_time);

  let scheduleId = current.schedule_id;
  if (timeOrDateChanged && next.status !== "cancelled") {
    const { schedule } = await ensureWithinDoctorSchedule({
      doctorId: current.doctor_id,
      dateStr: next.appointment_date,
      startTime: String(next.start_time),
      endTime: String(next.end_time),
    });

    const conflict = await findBookingConflictByDoctor({
      doctorId: current.doctor_id,
      date: next.appointment_date,
      startTime: String(next.start_time),
      endTime: String(next.end_time),
      excludeId: id,
    });
    if (conflict) {
      throw new Error(`Slot sudah dibooking (conflict_id=${conflict.id})`);
    }
    scheduleId = schedule.id;
  }

  const shouldSetCancelledAt = "status" in payload && payload.status === "cancelled";

  const rows = await sql.query(
    `
      UPDATE public.appointments
      SET appointment_date = $2,
          start_time = $3,
          end_time = $4,
          status = $5,
          notes = $6,
          schedule_id = $7,
          cancelled_at = CASE WHEN $8 THEN NOW() ELSE cancelled_at END,
          updated_at = NOW()
      WHERE id = $1
      RETURNING id, doctor_id, pasien_id, schedule_id, appointment_date, start_time, end_time, status, notes, created_at, updated_at, cancelled_at
    `,
    [
      id,
      next.appointment_date,
      next.start_time,
      next.end_time,
      next.status,
      next.notes ?? null,
      scheduleId ?? null,
      shouldSetCancelledAt,
    ]
  );

  return rows[0] || null;
};

export const deleteBookingByIdService = async (id) => {
  const rows = await sql.query(
    `
      DELETE FROM public.appointments
      WHERE id = $1
      RETURNING id, doctor_id, pasien_id, schedule_id, appointment_date, start_time, end_time, status
    `,
    [id]
  );
  return rows[0] || null;
};

export const listBookingsByDoctorDateService = async ({ doctorId, date }) => {
  return sql.query(
    `
      SELECT id, doctor_id, pasien_id, appointment_date, start_time, end_time, status
      FROM public.appointments
      WHERE doctor_id = $1
        AND appointment_date = $2
        AND status <> 'cancelled'
      ORDER BY start_time ASC
    `,
    [doctorId, date]
  );
};

