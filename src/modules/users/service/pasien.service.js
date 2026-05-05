import { sql } from "../../../config/db.js";
import bcrypt from "bcrypt";
import { generateHexId } from "../../../utils/id.js";

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
