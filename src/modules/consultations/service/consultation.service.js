import { sql } from "../../../config/db.js";

export async function createConsultationService({
  pasien_id,
  doctor_id,
  booking_id = null,
  topik = null,
} = {}) {
  const rows = await sql.query(
    `
      INSERT INTO consultations
        (pasien_id, doctor_id, booking_id, topik)
      VALUES
        ($1, $2, $3, $4)
      RETURNING *
    `,
    [pasien_id, doctor_id, booking_id, topik]
  );

  return rows[0] || null;
}

export async function listConsultationsByPasienService(pasienId, { status, limit = 50, offset = 0 } = {}) {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(200, Number(limit))) : 50;
  const safeOffset = Number.isFinite(Number(offset)) ? Math.max(0, Number(offset)) : 0;

  const where = ["c.deleted_at IS NULL", "c.pasien_id = $1"];
  const params = [pasienId];

  if (status) {
    params.push(status);
    where.push(`c.status = $${params.length}`);
  }

  params.push(safeLimit);
  const limitParam = `$${params.length}`;
  params.push(safeOffset);
  const offsetParam = `$${params.length}`;

  const query = `
    SELECT
      c.*,
      u_doctor.name AS doctor_name
    FROM consultations c
    LEFT JOIN users u_doctor ON u_doctor.id = c.doctor_id
    WHERE ${where.join(" AND ")}
    ORDER BY c.created_at DESC
    LIMIT ${limitParam}
    OFFSET ${offsetParam}
  `;

  return sql.query(query, params);
}

export async function listConsultationsByDoctorService(doctorId, { status, limit = 50, offset = 0 } = {}) {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(200, Number(limit))) : 50;
  const safeOffset = Number.isFinite(Number(offset)) ? Math.max(0, Number(offset)) : 0;

  const where = ["c.deleted_at IS NULL", "c.doctor_id = $1"];
  const params = [doctorId];

  if (status) {
    params.push(status);
    where.push(`c.status = $${params.length}`);
  }

  params.push(safeLimit);
  const limitParam = `$${params.length}`;
  params.push(safeOffset);
  const offsetParam = `$${params.length}`;

  const query = `
    SELECT
      c.*,
      u_pasien.name AS pasien_name
    FROM consultations c
    LEFT JOIN users u_pasien ON u_pasien.id = c.pasien_id
    WHERE ${where.join(" AND ")}
    ORDER BY c.created_at DESC
    LIMIT ${limitParam}
    OFFSET ${offsetParam}
  `;

  return sql.query(query, params);
}

export async function getConsultationByIdService(id) {
  const rows = await sql.query(
    `
      SELECT
        c.*,
        u_pasien.name AS pasien_name,
        u_doctor.name AS doctor_name
      FROM consultations c
      LEFT JOIN users u_pasien ON u_pasien.id = c.pasien_id
      LEFT JOIN users u_doctor ON u_doctor.id = c.doctor_id
      WHERE c.id = $1
        AND c.deleted_at IS NULL
      LIMIT 1
    `,
    [id]
  );
  return rows[0] || null;
}

export async function updateConsultationStatusService(id, status) {
  const endedAtExpr = status === "aktif" ? "NULL" : "CURRENT_TIMESTAMP";
  const rows = await sql.query(
    `
      UPDATE consultations
      SET status = $2,
          ended_at = ${endedAtExpr},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING *
    `,
    [id, status]
  );

  return rows[0] || null;
}

export async function softDeleteConsultationService(id) {
  const rows = await sql.query(
    `
      UPDATE consultations
      SET deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING id, pasien_id, doctor_id, status, deleted_at
    `,
    [id]
  );

  return rows[0] || null;
}

export async function sendMessageService({ consultation_id, sender_id, message, file_url, type }) {
  const consult = await sql.query(
    `
      SELECT id, status
      FROM consultations
      WHERE id = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [consultation_id]
  );
  const row = consult[0];
  if (!row) throw new Error("Konsultasi tidak ditemukan");

  const inserted = await sql.query(
    `
      INSERT INTO messages
        (consultation_id, sender_id, message, file_url, type, is_read)
      VALUES
        ($1, $2, $3, $4, $5, false)
      RETURNING *
    `,
    [consultation_id, sender_id, message ?? null, file_url ?? null, type]
  );

  return inserted[0] || null;
}

export async function listMessagesService(consultationId, { limit = 50, offset = 0 } = {}) {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(200, Number(limit))) : 50;
  const safeOffset = Number.isFinite(Number(offset)) ? Math.max(0, Number(offset)) : 0;

  const params = [consultationId, safeLimit, safeOffset];
  return sql.query(
    `
      SELECT
        m.*,
        u.name AS sender_name
      FROM messages m
      LEFT JOIN users u ON u.id = m.sender_id
      WHERE m.consultation_id = $1
      ORDER BY m.created_at ASC
      LIMIT $2
      OFFSET $3
    `,
    params
  );
}

export async function markMessagesReadService({ consultation_id, user_id }) {
  const rows = await sql.query(
    `
      UPDATE messages
      SET is_read = true
      WHERE consultation_id = $1
        AND sender_id <> $2
        AND is_read = false
      RETURNING id
    `,
    [consultation_id, user_id]
  );

  return { updated_count: rows.length };
}

