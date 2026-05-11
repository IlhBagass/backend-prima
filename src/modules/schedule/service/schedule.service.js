import { sql } from "../../../config/db.js";

const UPDATE_COLUMNS = ["day_of_week", "start_time", "end_time"];

const findScheduleConflict = async ({ doctorId, dayOfWeek, startTime, endTime, excludeId }) => {
  const params = [doctorId, dayOfWeek, startTime, endTime];
  let excludeSql = "";
  if (excludeId) {
    params.push(excludeId);
    excludeSql = `AND id <> $${params.length}`;
  }

  const rows = await sql.query(
    `
      SELECT id, doctor_id, day_of_week, start_time, end_time
      FROM public.schedules
      WHERE doctor_id = $1
        AND day_of_week = $2
        AND NOT (end_time <= $3 OR start_time >= $4)
        ${excludeSql}
      LIMIT 1
    `,
    params
  );

  return rows[0] || null;
};

export const createScheduleService = async ({ doctor_id, day_of_week, start_time, end_time }) => {
  const conflict = await findScheduleConflict({
    doctorId: doctor_id,
    dayOfWeek: day_of_week,
    startTime: start_time,
    endTime: end_time,
  });
  if (conflict) {
    throw new Error(
      `Jadwal bentrok: sudah ada jadwal lain di hari yang sama dan jam yang overlap (conflict_id=${conflict.id})`
    );
  }

  const rows = await sql.query(
    `
      INSERT INTO public.schedules (doctor_id, day_of_week, start_time, end_time)
      VALUES ($1, $2, $3, $4)
      RETURNING id, doctor_id, day_of_week, start_time, end_time
    `,
    [doctor_id, day_of_week, start_time, end_time]
  );

  return rows[0] || null;
};

export const listSchedulesByDoctorService = async (doctorId) => {
  return sql.query(
    `
      SELECT id, doctor_id, day_of_week, start_time, end_time
      FROM public.schedules
      WHERE doctor_id = $1
      ORDER BY day_of_week ASC, start_time ASC
    `,
    [doctorId]
  );
};

export const listSchedulesByDoctorAndDayService = async ({ doctorId, dayOfWeek }) => {
  return sql.query(
    `
      SELECT id, doctor_id, day_of_week, start_time, end_time
      FROM public.schedules
      WHERE doctor_id = $1
        AND day_of_week = $2
      ORDER BY start_time ASC
    `,
    [doctorId, dayOfWeek]
  );
};

export const updateScheduleByIdService = async (id, payload = {}) => {
  const currentRows = await sql.query(
    `
      SELECT id, doctor_id, day_of_week, start_time, end_time
      FROM public.schedules
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );
  const current = currentRows[0] || null;
  if (!current) return null;

  const nextDay = "day_of_week" in payload && payload.day_of_week !== undefined ? payload.day_of_week : current.day_of_week;
  const nextStart =
    "start_time" in payload && payload.start_time !== undefined ? payload.start_time : current.start_time;
  const nextEnd = "end_time" in payload && payload.end_time !== undefined ? payload.end_time : current.end_time;

  const conflict = await findScheduleConflict({
    doctorId: current.doctor_id,
    dayOfWeek: nextDay,
    startTime: nextStart,
    endTime: nextEnd,
    excludeId: id,
  });
  if (conflict) {
    throw new Error(
      `Jadwal bentrok: sudah ada jadwal lain di hari yang sama dan jam yang overlap (conflict_id=${conflict.id})`
    );
  }

  const setClauses = [];
  const params = [id];

  for (const column of UPDATE_COLUMNS) {
    if (!(column in payload)) continue;
    if (payload[column] === undefined) continue;
    params.push(payload[column]);
    setClauses.push(`${column} = $${params.length}`);
  }

  if (setClauses.length === 0) {
    throw new Error("Tidak ada field jadwal untuk diupdate");
  }

  const rows = await sql.query(
    `
      UPDATE public.schedules
      SET ${setClauses.join(", ")}
      WHERE id = $1
      RETURNING id, doctor_id, day_of_week, start_time, end_time
    `,
    params
  );

  return rows[0] || null;
};

export const deleteScheduleByIdService = async (id) => {
  const rows = await sql.query(
    `
      DELETE FROM public.schedules
      WHERE id = $1
      RETURNING id, doctor_id, day_of_week, start_time, end_time
    `,
    [id]
  );

  return rows[0] || null;
};
