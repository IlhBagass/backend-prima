import { sql } from "../../../config/db.js";
import bcrypt from "bcrypt";
import { generateHexId } from "../../../utils/id.js";

export const registerDoctorService = async ({
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
  nomor_str,
  nomor_sip,
  spesialisasi,
  sub_spesialisasi,
  pengalaman_tahun,
  deskripsi_profil,
  biaya_konsultasi,
  nama_klinik,
  alamat_klinik,
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

  // Validasi STR & SIP wajib
  if (!nomor_str || !nomor_sip) {
    throw new Error("Nomor STR dan SIP wajib diisi untuk dokter");
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
