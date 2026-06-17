import { sql } from "../../../config/db.js";
import bcrypt from "bcryptjs";
import { generateHexId } from "../../../utils/id.js";

const DOCTOR_PROFILE_COLUMNS = [
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

export const registerDoctorService = async ({
  name,
  email,
  password,
  nama_panggilan = null,
  foto_profil_url = null,
  jenis_kelamin = null,
  tanggal_lahir = null,
  no_telepon = null,
  alamat = null,
  kota = null,
  provinsi = null,
  kode_pos = null,
  nomor_str = null,
  nomor_sip = null,
  spesialisasi = null,
  sub_spesialisasi = null,
  pengalaman_tahun = null,
  deskripsi_profil = null,
  biaya_konsultasi = null,
  nama_klinik = null,
  alamat_klinik = null,
}) => {
  // Cek email duplikat
  const emailCheck = await sql`
    SELECT id FROM users 
    WHERE email = ${email} 
    AND deleted_at IS NULL
  `;
  if (emailCheck.length > 0) {
    throw new Error("Email sudah terdaftar");
  }

  if (!nomor_str || !nomor_sip) {
    throw new Error("Nomor STR dan SIP wajib diisi untuk dokter");
  }

  let id = generateHexId(5); 
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
      nomor_str, nomor_sip, spesialisasi, sub_spesialisasi,
      pengalaman_tahun, deskripsi_profil, biaya_konsultasi,
      nama_klinik, alamat_klinik,
      created_at, updated_at
    ) VALUES (
      ${id}, ${name}, ${email}, ${hashedPassword}, 'doctor',
      'menunggu_verifikasi', NULL,
      ${nama_panggilan}, ${foto_profil_url}, ${jenis_kelamin},
      ${tanggal_lahir}, ${no_telepon}, ${alamat}, ${kota}, ${provinsi}, ${kode_pos},
      ${nomor_str}, ${nomor_sip}, ${spesialisasi}, ${sub_spesialisasi},
      ${pengalaman_tahun}, ${deskripsi_profil}, ${biaya_konsultasi},
      ${nama_klinik}, ${alamat_klinik},
      CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
    ) RETURNING id, name, email, role, status, spesialisasi, created_at
  `;

  return result[0];
};

export const updateDoctorProfileByIdService = async (id, payload = {}) => {
  const setClauses = [];
  const params = [id];

  for (const column of DOCTOR_PROFILE_COLUMNS) {
    if (!(column in payload)) continue;
    if (payload[column] === undefined) continue;
    params.push(payload[column]);
    setClauses.push(`${column} = $${params.length}`);
  }

  if (setClauses.length === 0) {
    throw new Error("Tidak ada field profil dokter untuk diupdate");
  }

  const query = `
    UPDATE users
    SET ${setClauses.join(", ")},
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
      AND role = 'doctor'
      AND deleted_at IS NULL
    RETURNING
      id, name, email, role, status,
      nama_panggilan, foto_profil_url, jenis_kelamin, tanggal_lahir, no_telepon,
      alamat, kota, provinsi, kode_pos,
      nomor_str, nomor_sip, spesialisasi, sub_spesialisasi,
      pengalaman_tahun, deskripsi_profil, biaya_konsultasi, nama_klinik, alamat_klinik,
      created_at, updated_at
  `;

  const rows = await sql.query(query, params);
  return rows[0] || null;
};
