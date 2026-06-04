import { sql } from "../../../config/db.js";

const PROGRAM_COLUMNS = [
  "nama",
  "deskripsi",
  "type",
  "tanggal_mulai",
  "tanggal_selesai",
  "lokasi",
  "kuota",
  "status",
];

export async function createProgramService(payload) {
  const rows = await sql.query(
    `
      INSERT INTO health_programs
        (nama, deskripsi, type, tanggal_mulai, tanggal_selesai, lokasi, kuota, status)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `,
    [
      payload.nama,
      payload.deskripsi ?? null,
      payload.type,
      payload.tanggal_mulai,
      payload.tanggal_selesai,
      payload.lokasi ?? null,
      payload.kuota,
      payload.status,
    ]
  );

  return rows[0] || null;
}

export async function listProgramsService({
  type,
  status,
  date_from,
  date_to,
  limit = 50,
  offset = 0,
} = {}) {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(200, Number(limit))) : 50;
  const safeOffset = Number.isFinite(Number(offset)) ? Math.max(0, Number(offset)) : 0;

  const where = ["deleted_at IS NULL"];
  const params = [];

  if (type) {
    params.push(type);
    where.push(`type = $${params.length}`);
  }

  if (status) {
    params.push(status);
    where.push(`status = $${params.length}`);
  }

  // overlap window
  if (date_from) {
    params.push(date_from);
    where.push(`tanggal_selesai >= $${params.length}`);
  }

  if (date_to) {
    params.push(date_to);
    where.push(`tanggal_mulai <= $${params.length}`);
  }

  params.push(safeLimit);
  const limitParam = `$${params.length}`;
  params.push(safeOffset);
  const offsetParam = `$${params.length}`;

  const query = `
    SELECT *
    FROM health_programs
    WHERE ${where.join(" AND ")}
    ORDER BY created_at DESC
    LIMIT ${limitParam}
    OFFSET ${offsetParam}
  `;

  return sql.query(query, params);
}

export async function getProgramDetailService(programId) {
  const rows = await sql.query(
    `
      SELECT
        hp.*,
        (
          SELECT COUNT(*)
          FROM health_program_participants hpp
          WHERE hpp.program_id = hp.id
            AND hpp.deleted_at IS NULL
        )::int AS participants_count
      FROM health_programs hp
      WHERE hp.id = $1
        AND hp.deleted_at IS NULL
      LIMIT 1
    `,
    [programId]
  );

  return rows[0] || null;
}

export async function updateProgramService(programId, payload = {}) {
  const setClauses = [];
  const params = [programId];

  for (const column of PROGRAM_COLUMNS) {
    if (!(column in payload)) continue;
    if (payload[column] === undefined) continue;

    params.push(payload[column]);
    setClauses.push(`${column} = $${params.length}`);
  }

  if (setClauses.length === 0) {
    throw new Error("Tidak ada field untuk diupdate");
  }

  const rows = await sql.query(
    `
      UPDATE health_programs
      SET ${setClauses.join(", ")},
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING *
    `,
    params
  );

  return rows[0] || null;
}

export async function softDeleteProgramService(programId) {
  const rows = await sql.query(
    `
      UPDATE health_programs
      SET deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING id, nama, type, status, deleted_at
    `,
    [programId]
  );

  return rows[0] || null;
}

export async function registerParticipantService({ program_id, pasien_id }) {
  const programRows = await sql.query(
    `
      SELECT id, kuota, status
      FROM health_programs
      WHERE id = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [program_id]
  );

  const program = programRows[0];
  if (!program) throw new Error("Program tidak ditemukan");
  if (String(program.status) !== "aktif") throw new Error("Program tidak aktif");

  const existing = await sql.query(
    `
      SELECT id, status, created_at
      FROM health_program_participants
      WHERE program_id = $1
        AND pasien_id = $2
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [program_id, pasien_id]
  );

  if (existing[0]) throw new Error("Pasien sudah terdaftar pada program ini");

  if (Number(program.kuota) > 0) {
    const countRows = await sql.query(
      `
        SELECT COUNT(*)::int AS total
        FROM health_program_participants
        WHERE program_id = $1
          AND deleted_at IS NULL
          AND status IN ('menunggu','diterima')
      `,
      [program_id]
    );
    const total = countRows[0]?.total ?? 0;
    if (total >= Number(program.kuota)) throw new Error("Kuota penuh");
  }

  const inserted = await sql.query(
    `
      INSERT INTO health_program_participants
        (program_id, pasien_id, status)
      VALUES
        ($1, $2, 'menunggu')
      RETURNING *
    `,
    [program_id, pasien_id]
  );

  return inserted[0] || null;
}

export async function cancelRegistrationService({ program_id, pasien_id }) {
  const rows = await sql.query(
    `
      UPDATE health_program_participants
      SET deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE program_id = $1
        AND pasien_id = $2
        AND deleted_at IS NULL
      RETURNING program_id, pasien_id, status, deleted_at
    `,
    [program_id, pasien_id]
  );

  return rows[0] || null;
}

export async function listParticipantsService(programId, { status, limit = 50, offset = 0 } = {}) {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(200, Number(limit))) : 50;
  const safeOffset = Number.isFinite(Number(offset)) ? Math.max(0, Number(offset)) : 0;

  const where = ["hpp.program_id = $1", "hpp.deleted_at IS NULL"];
  const params = [programId];

  if (status) {
    params.push(status);
    where.push(`hpp.status = $${params.length}`);
  }

  params.push(safeLimit);
  const limitParam = `$${params.length}`;
  params.push(safeOffset);
  const offsetParam = `$${params.length}`;

  const query = `
    SELECT
      hpp.program_id,
      hpp.pasien_id,
      hpp.status,
      hpp.created_at,
      hpp.updated_at,
      u.name AS pasien_name,
      u.email AS pasien_email
    FROM health_program_participants hpp
    LEFT JOIN users u ON u.id = hpp.pasien_id
    WHERE ${where.join(" AND ")}
    ORDER BY hpp.created_at DESC
    LIMIT ${limitParam}
    OFFSET ${offsetParam}
  `;

  return sql.query(query, params);
}

export async function updateParticipantStatusService({ program_id, pasien_id, status }) {
  const rows = await sql.query(
    `
      UPDATE health_program_participants
      SET status = $3,
          updated_at = CURRENT_TIMESTAMP
      WHERE program_id = $1
        AND pasien_id = $2
        AND deleted_at IS NULL
      RETURNING program_id, pasien_id, status, updated_at
    `,
    [program_id, pasien_id, status]
  );

  return rows[0] || null;
}
