import { sql } from "../../../config/db.js";

const toBool = (value) => {
  if (value === true || value === false) return value;
  if (typeof value !== "string") return null;
  const v = value.trim().toLowerCase();
  if (v === "true" || v === "1" || v === "yes") return true;
  if (v === "false" || v === "0" || v === "no") return false;
  return null;
};

export const listDoctorsService = async ({
  nama,
  spesialisasi,
  kota,
  tersedia,
  limit = 50,
  offset = 0,
  rating_min,
} = {}) => {
  // rating belum ada sumber tabel/kolom di repo ini, jadi jangan dipakai diam-diam.
  if (rating_min !== undefined && rating_min !== null && String(rating_min).trim() !== "") {
    throw new Error("Filter rating_min belum didukung (tabel rating/ulasan belum ada)");
  }

  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(200, Number(limit))) : 50;
  const safeOffset = Number.isFinite(Number(offset)) ? Math.max(0, Number(offset)) : 0;

  const where = ["u.deleted_at IS NULL", "u.role = 'doctor'"];
  const params = [];

  if (nama) {
    params.push(`%${String(nama).trim()}%`);
    where.push(`u.name ILIKE $${params.length}`);
  }
  if (spesialisasi) {
    params.push(`%${String(spesialisasi).trim()}%`);
    where.push(`COALESCE(u.spesialisasi,'') ILIKE $${params.length}`);
  }
  if (kota) {
    params.push(`%${String(kota).trim()}%`);
    where.push(`COALESCE(u.kota,'') ILIKE $${params.length}`);
  }

  const tersediaBool = toBool(tersedia);
  if (tersediaBool === true) {
    where.push(
      `EXISTS (SELECT 1 FROM public.schedules s WHERE s.doctor_id = u.id)`
    );
  } else if (tersediaBool === false) {
    where.push(
      `NOT EXISTS (SELECT 1 FROM public.schedules s WHERE s.doctor_id = u.id)`
    );
  }

  params.push(safeLimit);
  const limitParam = `$${params.length}`;
  params.push(safeOffset);
  const offsetParam = `$${params.length}`;

  const query = `
    SELECT
      u.id,
      u.name,
      u.email,
      u.role,
      u.status,
      u.foto_profil_url,
      u.kota,
      u.provinsi,
      u.spesialisasi,
      u.sub_spesialisasi,
      u.pengalaman_tahun,
      u.deskripsi_profil,
      u.biaya_konsultasi,
      u.nama_klinik,
      u.alamat_klinik,
      u.created_at,
      u.updated_at,
      (SELECT COUNT(*)::int FROM public.schedules s WHERE s.doctor_id = u.id) AS schedules_count,
      (SELECT COUNT(*)::int FROM public.appointments a WHERE a.doctor_id = u.id AND a.status <> 'cancelled') AS bookings_count
    FROM public.users u
    WHERE ${where.join(" AND ")}
    ORDER BY u.created_at DESC
    LIMIT ${limitParam}
    OFFSET ${offsetParam}
  `;

  return sql.query(query, params);
};

export const getDoctorDetailService = async (id) => {
  const rows = await sql.query(
    `
      SELECT
        u.id,
        u.name,
        u.email,
        u.role,
        u.status,
        u.foto_profil_url,
        u.kota,
        u.provinsi,
        u.spesialisasi,
        u.sub_spesialisasi,
        u.pengalaman_tahun,
        u.deskripsi_profil,
        u.biaya_konsultasi,
        u.nama_klinik,
        u.alamat_klinik,
        u.created_at,
        u.updated_at
      FROM public.users u
      WHERE u.id = $1
        AND u.role = 'doctor'
        AND u.deleted_at IS NULL
      LIMIT 1
    `,
    [id]
  );

  const doctor = rows[0] || null;
  if (!doctor) return null;

  const schedules = await sql.query(
    `
      SELECT id, doctor_id, day_of_week, start_time, end_time
      FROM public.schedules
      WHERE doctor_id = $1
      ORDER BY day_of_week ASC, start_time ASC
    `,
    [id]
  );

  const bookingStats = await sql.query(
    `
      SELECT
        COUNT(*)::int AS total_bookings,
        SUM(CASE WHEN status = 'booked' THEN 1 ELSE 0 END)::int AS booked_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END)::int AS completed_count,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END)::int AS cancelled_count
      FROM public.appointments
      WHERE doctor_id = $1
    `,
    [id]
  );

  return {
    ...doctor,
    schedules,
    booking_stats: bookingStats[0] || { total_bookings: 0, booked_count: 0, completed_count: 0, cancelled_count: 0 },
    rating: null,
    ulasan: [],
  };
};

