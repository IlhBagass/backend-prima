import { sql } from "../../../config/db.js";
import bcrypt from "bcrypt";
import { generateHexId } from "../../../utils/id.js";

const PASIEN_PROFILE_COLUMNS = [
  "name",
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
];

export const registerPasienService = async ({
  name,
  email,
  password,
  nama_panggilan,
  foto_profil_url,
  jenis_kelamin,
  tanggal_lahir,
  no_telepon,
  alamat,
  kota,
  provinsi,
  kode_pos,
  nik,
  golongan_darah,
  rhesus,
  tinggi_badan_cm,
  berat_badan_kg,
  riwayat_alergi,
  riwayat_penyakit,
  no_bpjs,
}) => {
  const emailCheck = await sql`
    SELECT id FROM users 
    WHERE email = ${email} 
    AND deleted_at IS NULL
  `;
  if (emailCheck.length > 0) {
    throw new Error("Email sudah terdaftar");
  }

  let id = generateHexId(5); // 10 chars hex uppercase, contoh: 4C4623CBEF
  for (let i = 0; i < 5; i++) {
    const exists = await sql`
      SELECT id FROM users
      WHERE id = ${id}
      LIMIT 1
    `;
    if (exists.length === 0) break;
    id = generateHexId(5);
  }
  const hashedPassword = await bcrypt.hash(password, 10);

  const result = await sql`
    INSERT INTO users (
      id, name, email, password, role,
      status, email_verified_at,
      nama_panggilan, foto_profil_url, jenis_kelamin,
      tanggal_lahir, no_telepon, alamat, kota, provinsi, kode_pos,
      nik, golongan_darah, rhesus, tinggi_badan_cm,
      berat_badan_kg, riwayat_alergi, riwayat_penyakit, no_bpjs,
      created_at, updated_at
    ) VALUES (
      ${id}, ${name}, ${email}, ${hashedPassword}, 'pasien',
      'menunggu_verifikasi', NULL,
      ${nama_panggilan}, ${foto_profil_url}, ${jenis_kelamin},
      ${tanggal_lahir}, ${no_telepon}, ${alamat}, ${kota}, ${provinsi}, ${kode_pos},
      ${nik}, ${golongan_darah}, ${rhesus}, ${tinggi_badan_cm},
      ${berat_badan_kg}, ${riwayat_alergi}, ${riwayat_penyakit}, ${no_bpjs},
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ) RETURNING id, name, email, role, status, created_at
  `;

  return result[0];
};

export const updatePasienProfileByIdService = async (id, payload = {}) => {
  const setClauses = [];
  const params = [id];

  for (const column of PASIEN_PROFILE_COLUMNS) {
    if (!(column in payload)) continue;
    if (payload[column] === undefined) continue;
    params.push(payload[column]);
    setClauses.push(`${column} = $${params.length}`);
  }

  if (setClauses.length === 0) {
    throw new Error("Tidak ada field profil pasien untuk diupdate");
  }

  const query = `
    UPDATE users
    SET ${setClauses.join(", ")},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
      AND role = 'pasien'
      AND deleted_at IS NULL
    RETURNING
      id, name, email, role, status,
      nama_panggilan, foto_profil_url, jenis_kelamin, tanggal_lahir, no_telepon,
      alamat, kota, provinsi, kode_pos,
      nik, golongan_darah, rhesus, tinggi_badan_cm, berat_badan_kg,
      riwayat_alergi, riwayat_penyakit, no_bpjs,
      created_at, updated_at
  `;

  const rows = await sql.query(query, params);
  return rows[0] || null;
};
