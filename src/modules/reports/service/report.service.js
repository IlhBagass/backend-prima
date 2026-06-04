import { sql } from "../../../config/db.js";
import { generateReportPdf } from "../utils/pdf.js";
import { rowsToCsv } from "../utils/csv.js";

const clamp = ({ limit = 50, offset = 0 } = {}) => {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(500, Number(limit))) : 50;
  const safeOffset = Number.isFinite(Number(offset)) ? Math.max(0, Number(offset)) : 0;
  return { safeLimit, safeOffset };
};

const parseDate = (s) => {
  if (!s) return null;
  const str = String(s).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(str)) return null;
  return str;
};

const monthStart = () => {
  const now = new Date();
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return d.toISOString().slice(0, 10);
};

export const reportUsersService = async ({ role, status, date_from, date_to, limit, offset } = {}) => {
  const { safeLimit, safeOffset } = clamp({ limit, offset });
  const from = parseDate(date_from);
  const to = parseDate(date_to);

  const where = ["deleted_at IS NULL"];
  const params = [];

  if (role) {
    params.push(role);
    where.push(`role = $${params.length}`);
  }
  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }
  if (from) {
    params.push(from);
    where.push(`created_at::date >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    where.push(`created_at::date <= $${params.length}`);
  }

  const totalRows = await sql.query(`SELECT COUNT(*)::int AS total FROM users WHERE ${where.join(" AND ")}`, params);
  const total = totalRows[0]?.total ?? 0;

  const breakdownRows = await sql.query(
    `
      SELECT role, COUNT(*)::int AS total
      FROM users
      WHERE deleted_at IS NULL
      GROUP BY role
    `
  );
  const breakdown = breakdownRows.reduce((acc, r) => {
    acc[String(r.role)] = r.total;
    return acc;
  }, {});

  const newThisMonthRows = await sql.query(
    `
      SELECT COUNT(*)::int AS total
      FROM users
      WHERE deleted_at IS NULL
        AND created_at::date >= $1
    `,
    [monthStart()]
  );

  params.push(safeLimit);
  const limitParam = `$${params.length}`;
  params.push(safeOffset);
  const offsetParam = `$${params.length}`;

  const users = await sql.query(
    `
      SELECT id, name AS nama, email, role, status, created_at::date AS created_at
      FROM users
      WHERE ${where.join(" AND ")}
      ORDER BY created_at DESC
      LIMIT ${limitParam}
      OFFSET ${offsetParam}
    `,
    params
  );

  return {
    summary: {
      total_users: total,
      breakdown,
      new_this_month: newThisMonthRows[0]?.total ?? 0,
    },
    users,
    pagination: { total, limit: safeLimit, offset: safeOffset },
  };
};

const normalizeAppointmentStatus = (raw) => {
  const s = String(raw || "").toLowerCase();
  if (s === "completed") return "selesai";
  if (s === "cancelled") return "dibatalkan";
  if (s === "booked") return "menunggu";
  return s || "menunggu";
};

export const reportAppointmentsService = async ({ status, doctor_id, date_from, date_to, limit, offset } = {}) => {
  const { safeLimit, safeOffset } = clamp({ limit, offset });
  const from = parseDate(date_from);
  const to = parseDate(date_to);

  const where = ["1=1"];
  const params = [];

  if (doctor_id) {
    params.push(doctor_id);
    where.push(`a.doctor_id = $${params.length}`);
  }
  if (from) {
    params.push(from);
    where.push(`a.appointment_date >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    where.push(`a.appointment_date <= $${params.length}`);
  }

  const totalRows = await sql.query(
    `SELECT COUNT(*)::int AS total FROM public.appointments a WHERE ${where.join(" AND ")}`,
    params
  );
  const total = totalRows[0]?.total ?? 0;

  const rawBreakdown = await sql.query(
    `
      SELECT a.status, COUNT(*)::int AS total
      FROM public.appointments a
      WHERE ${where.join(" AND ")}
      GROUP BY a.status
    `,
    params
  );
  const breakdown = rawBreakdown.reduce((acc, r) => {
    const key = normalizeAppointmentStatus(r.status);
    acc[key] = (acc[key] || 0) + (r.total || 0);
    return acc;
  }, {});

  if (status) {
    params.push(String(status).toLowerCase());
    // support filter by normalized label
    const s = params[params.length - 1];
    if (s === "selesai") where.push(`a.status IN ('completed','selesai')`);
    else if (s === "dibatalkan") where.push(`a.status IN ('cancelled','dibatalkan')`);
    else if (s === "menunggu") where.push(`a.status IN ('booked','menunggu')`);
    else where.push(`LOWER(a.status) = $${params.length}`);
  }

  params.push(safeLimit);
  const limitParam = `$${params.length}`;
  params.push(safeOffset);
  const offsetParam = `$${params.length}`;

  const rows = await sql.query(
    `
      SELECT
        a.id,
        u_pasien.name AS pasien_nama,
        u_doctor.name AS doctor_nama,
        a.appointment_date AS tanggal,
        a.start_time,
        a.status
      FROM public.appointments a
      LEFT JOIN users u_pasien ON u_pasien.id = a.pasien_id
      LEFT JOIN users u_doctor ON u_doctor.id = a.doctor_id
      WHERE ${where.join(" AND ")}
      ORDER BY a.appointment_date DESC, a.start_time ASC
      LIMIT ${limitParam}
      OFFSET ${offsetParam}
    `,
    params
  );

  const appointments = rows.map((r) => ({
    id: r.id,
    pasien_nama: r.pasien_nama ?? null,
    doctor_nama: r.doctor_nama ?? null,
    tanggal: String(r.tanggal),
    status: normalizeAppointmentStatus(r.status),
  }));

  return {
    summary: { total, breakdown },
    appointments,
    pagination: { total, limit: safeLimit, offset: safeOffset },
  };
};

export const reportConsultationsService = async ({ status, date_from, date_to, limit, offset } = {}) => {
  const { safeLimit, safeOffset } = clamp({ limit, offset });
  const from = parseDate(date_from);
  const to = parseDate(date_to);

  const where = ["c.deleted_at IS NULL"];
  const params = [];

  if (status) {
    params.push(String(status).toLowerCase());
    where.push(`LOWER(c.status) = $${params.length}`);
  }
  if (from) {
    params.push(from);
    where.push(`c.created_at::date >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    where.push(`c.created_at::date <= $${params.length}`);
  }

  const totalRows = await sql.query(
    `SELECT COUNT(*)::int AS total FROM consultations c WHERE ${where.join(" AND ")}`,
    params
  );
  const total = totalRows[0]?.total ?? 0;

  const breakdownRows = await sql.query(
    `
      SELECT c.status, COUNT(*)::int AS total
      FROM consultations c
      WHERE c.deleted_at IS NULL
      GROUP BY c.status
    `
  );
  const breakdown = breakdownRows.reduce((acc, r) => {
    acc[String(r.status)] = r.total;
    return acc;
  }, {});

  params.push(safeLimit);
  const limitParam = `$${params.length}`;
  params.push(safeOffset);
  const offsetParam = `$${params.length}`;

  const consultations = await sql.query(
    `
      SELECT
        c.id,
        c.status,
        c.topik,
        c.created_at::date AS created_at,
        u_pasien.name AS pasien_nama,
        u_doctor.name AS doctor_nama
      FROM consultations c
      LEFT JOIN users u_pasien ON u_pasien.id = c.pasien_id
      LEFT JOIN users u_doctor ON u_doctor.id = c.doctor_id
      WHERE ${where.join(" AND ")}
      ORDER BY c.created_at DESC
      LIMIT ${limitParam}
      OFFSET ${offsetParam}
    `,
    params
  );

  return {
    summary: { total, breakdown },
    consultations,
    pagination: { total, limit: safeLimit, offset: safeOffset },
  };
};

export const reportMedicalRecordsService = async ({ type, doctor_id, date_from, date_to, limit, offset } = {}) => {
  const { safeLimit, safeOffset } = clamp({ limit, offset });
  const from = parseDate(date_from);
  const to = parseDate(date_to);

  const where = ["mr.deleted_at IS NULL"];
  const params = [];

  if (type) {
    params.push(type);
    where.push(`mr.type = $${params.length}`);
  }
  if (doctor_id) {
    params.push(doctor_id);
    where.push(`mr.doctor_id = $${params.length}`);
  }
  if (from) {
    params.push(from);
    where.push(`mr.created_at::date >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    where.push(`mr.created_at::date <= $${params.length}`);
  }

  const totalRows = await sql.query(
    `SELECT COUNT(*)::int AS total FROM public.medical_records mr WHERE ${where.join(" AND ")}`,
    params
  );
  const total = totalRows[0]?.total ?? 0;

  const breakdownRows = await sql.query(
    `
      SELECT type, COUNT(*)::int AS total
      FROM public.medical_records
      WHERE deleted_at IS NULL
      GROUP BY type
    `
  );
  const breakdown = breakdownRows.reduce((acc, r) => {
    acc[String(r.type)] = r.total;
    return acc;
  }, {});

  params.push(safeLimit);
  const limitParam = `$${params.length}`;
  params.push(safeOffset);
  const offsetParam = `$${params.length}`;

  const medical_records = await sql.query(
    `
      SELECT
        mr.id,
        mr.type,
        mr.judul,
        mr.created_at::date AS created_at,
        u_pasien.name AS pasien_nama,
        u_doctor.name AS doctor_nama
      FROM public.medical_records mr
      LEFT JOIN users u_pasien ON u_pasien.id = mr.pasien_id
      LEFT JOIN users u_doctor ON u_doctor.id = mr.doctor_id
      WHERE ${where.join(" AND ")}
      ORDER BY mr.created_at DESC
      LIMIT ${limitParam}
      OFFSET ${offsetParam}
    `,
    params
  );

  return {
    summary: { total, breakdown },
    medical_records,
    pagination: { total, limit: safeLimit, offset: safeOffset },
  };
};

export const reportRevenueService = async ({ doctor_id, date_from, date_to, limit, offset } = {}) => {
  const { safeLimit, safeOffset } = clamp({ limit, offset });
  const from = parseDate(date_from);
  const to = parseDate(date_to);

  const where = ["u.role = 'doctor'", "u.deleted_at IS NULL"];
  const params = [];

  if (doctor_id) {
    params.push(doctor_id);
    where.push(`u.id = $${params.length}`);
  }

  const joinConds = ["a.doctor_id = u.id", "a.status IN ('completed','selesai')"];
  if (from) {
    params.push(from);
    joinConds.push(`a.appointment_date >= $${params.length}`);
  }
  if (to) {
    params.push(to);
    joinConds.push(`a.appointment_date <= $${params.length}`);
  }

  params.push(safeLimit);
  const limitParam = `$${params.length}`;
  params.push(safeOffset);
  const offsetParam = `$${params.length}`;

  const rows = await sql.query(
    `
      SELECT
        u.id AS doctor_id,
        u.name AS doctor_nama,
        u.spesialisasi,
        COALESCE(u.biaya_konsultasi, 0)::float AS biaya_konsultasi,
        COUNT(a.id)::int AS selesai_count
      FROM users u
      LEFT JOIN public.appointments a
        ON ${joinConds.join(" AND ")}
      WHERE ${where.join(" AND ")}
      GROUP BY u.id, u.name, u.spesialisasi, u.biaya_konsultasi
      ORDER BY u.created_at DESC
      LIMIT ${limitParam}
      OFFSET ${offsetParam}
    `,
    params
  );

  const revenueRows = rows.map((d) => {
    const selesai_count = d.selesai_count ?? 0;
    const estimasi_pendapatan = Math.round((Number(d.biaya_konsultasi) || 0) * selesai_count);
    return { ...d, selesai_count, estimasi_pendapatan };
  });

  const totalSelesai = revenueRows.reduce((acc, r) => acc + (r.selesai_count || 0), 0);
  const totalPendapatan = revenueRows.reduce((acc, r) => acc + (r.estimasi_pendapatan || 0), 0);

  return {
    summary: {
      total_konsultasi_selesai: totalSelesai,
      total_estimasi_pendapatan: totalPendapatan,
    },
    revenue: revenueRows,
    pagination: { limit: safeLimit, offset: safeOffset },
  };
};

const exportTypes = ["users", "appointments", "consultations", "medical-records"];

export const exportPdfService = async ({ type, date_from, date_to }) => {
  const t = String(type || "").trim();
  if (!exportTypes.includes(t)) {
    throw new Error(`type export tidak valid. Pilihan: ${exportTypes.join(", ")}`);
  }

  const from = parseDate(date_from);
  const to = parseDate(date_to);

  const data = await (async () => {
    if (t === "users") return reportUsersService({ date_from: from, date_to: to, limit: 200, offset: 0 });
    if (t === "appointments") return reportAppointmentsService({ date_from: from, date_to: to, limit: 200, offset: 0 });
    if (t === "consultations") return reportConsultationsService({ date_from: from, date_to: to, limit: 200, offset: 0 });
    return reportMedicalRecordsService({ date_from: from, date_to: to, limit: 200, offset: 0 });
  })();

  const titleMap = {
    users: "Laporan Pengguna",
    appointments: "Laporan Janji Temu",
    consultations: "Laporan Konsultasi",
    "medical-records": "Laporan Rekam Medis",
  };

  const pdfBuffer = await generateReportPdf({
    title: titleMap[t] || "Laporan",
    type: t,
    date_from: from,
    date_to: to,
    data,
  });

  const filename = `report-${t}-${new Date().toISOString().slice(0, 10)}.pdf`;
  return { filename, pdfBuffer };
};

export const exportCsvService = async ({ type, date_from, date_to }) => {
  const t = String(type || "").trim();
  if (!exportTypes.includes(t)) {
    throw new Error(`type export tidak valid. Pilihan: ${exportTypes.join(", ")}`);
  }

  const from = parseDate(date_from);
  const to = parseDate(date_to);

  const data = await (async () => {
    if (t === "users") return reportUsersService({ date_from: from, date_to: to, limit: 1000, offset: 0 });
    if (t === "appointments") return reportAppointmentsService({ date_from: from, date_to: to, limit: 1000, offset: 0 });
    if (t === "consultations") return reportConsultationsService({ date_from: from, date_to: to, limit: 1000, offset: 0 });
    return reportMedicalRecordsService({ date_from: from, date_to: to, limit: 1000, offset: 0 });
  })();

  const rows = (() => {
    if (t === "users") return data.users || [];
    if (t === "appointments") return data.appointments || [];
    if (t === "consultations") return data.consultations || [];
    return data.medical_records || [];
  })();

  const csvText = rowsToCsv(rows);
  const filename = `report-${t}-${new Date().toISOString().slice(0, 10)}.csv`;
  return { filename, csvText };
};
