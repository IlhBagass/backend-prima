import { sql } from "../../../config/db.js";
import bcrypt from "bcrypt";

const PUBLIC_USER_COLUMNS = [
  "id",
  "name",
  "email",
  "role",
  "status",
  "email_verified_at",
  "nama_panggilan",
  "foto_profil_url",
  "jenis_kelamin",
  "tanggal_lahir",
  "no_telepon",
  "alamat",
  "kota",
  "provinsi",
  "kode_pos",
  "nik",
  "golongan_darah",
  "rhesus",
  "tinggi_badan_cm",
  "berat_badan_kg",
  "riwayat_alergi",
  "riwayat_penyakit",
  "no_bpjs",
  "nomor_str",
  "nomor_sip",
  "spesialisasi",
  "sub_spesialisasi",
  "pengalaman_tahun",
  "deskripsi_profil",
  "biaya_konsultasi",
  "nama_klinik",
  "alamat_klinik",
  "created_at",
  "updated_at",
];

const USER_COLUMNS = [
  "name",
  "email",
  "password",
  "role",
  "status",
  "email_verified_at",
  "nama_panggilan",
  "foto_profil_url",
  "jenis_kelamin",
  "tanggal_lahir",
  "no_telepon",
  "alamat",
  "kota",
  "provinsi",
  "kode_pos",
  "nik",
  "golongan_darah",
  "rhesus",
  "tinggi_badan_cm",
  "berat_badan_kg",
  "riwayat_alergi",
  "riwayat_penyakit",
  "no_bpjs",
  "nomor_str",
  "nomor_sip",
  "spesialisasi",
  "sub_spesialisasi",
  "pengalaman_tahun",
  "deskripsi_profil",
  "biaya_konsultasi",
  "nama_klinik",
  "alamat_klinik",
];

export const listUsersService = async ({ limit = 50, offset = 0, role, status } = {}) => {
  const safeLimit = Number.isFinite(Number(limit)) ? Math.max(1, Math.min(200, Number(limit))) : 50;
  const safeOffset = Number.isFinite(Number(offset)) ? Math.max(0, Number(offset)) : 0;

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

  params.push(safeLimit);
  const limitParam = `$${params.length}`;
  params.push(safeOffset);
  const offsetParam = `$${params.length}`;

  const query = `
    SELECT
      id, name, email, role, status,
      spesialisasi,
      created_at, updated_at
    FROM users
    WHERE ${where.join(" AND ")}
    ORDER BY created_at DESC
    LIMIT ${limitParam}
    OFFSET ${offsetParam}
  `;

  return sql.query(query, params);
};

export const getUserByIdService = async (id) => {
  const columns = PUBLIC_USER_COLUMNS.join(", ");
  const rows = await sql.query(
    `
      SELECT ${columns}
      FROM users
      WHERE id = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [id]
  );

  return rows[0] || null;
};

export const updateUserByIdService = async (id, payload = {}) => {
  const setClauses = [];
  const params = [id];

  for (const column of USER_COLUMNS) {
    if (!(column in payload)) continue;
    if (payload[column] === undefined) continue;

    if (column === "password") {
      const hashedPassword = await bcrypt.hash(payload.password, 10);
      params.push(hashedPassword);
      setClauses.push(`password = $${params.length}`);
      continue;
    }

    params.push(payload[column]);
    setClauses.push(`${column} = $${params.length}`);
  }

  if (setClauses.length === 0) {
    throw new Error("Tidak ada field untuk diupdate");
  }

  const query = `
    UPDATE users
    SET ${setClauses.join(", ")},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
      AND deleted_at IS NULL
    RETURNING
      id, name, email, role, status,
      spesialisasi,
      created_at, updated_at
  `;

  const rows = await sql.query(query, params);
  return rows[0] || null;
};

export const deleteUserByIdService = async (id) => {
  const rows = await sql.query(
    `
      UPDATE users
      SET deleted_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING id, name, email, role, status, deleted_at
    `,
    [id]
  );

  return rows[0] || null;
};

export const hardDeleteUserByIdService = async (id) => {
  const rows = await sql.query(
    `
      DELETE FROM users
      WHERE id = $1
      RETURNING id, name, email, role
    `,
    [id]
  );

  return rows[0] || null;
};

export const updateUserProfilePhotoUrlService = async (id, fotoProfilUrl) => {
  const rows = await sql.query(
    `
      UPDATE users
      SET foto_profil_url = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
        AND deleted_at IS NULL
      RETURNING id, role, foto_profil_url, updated_at
    `,
    [id, fotoProfilUrl]
  );

  return rows[0] || null;
};
