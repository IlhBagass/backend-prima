import { registerPasienService } from "../service/pasien.service.js";

export const registerPasien = async (req, res) => {
  try {
    const {
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
    } = req.body;

    if (!name || !email || !password) {
      return res.code(400).send({
        success: false,
        message: "name, email, dan password wajib diisi",
      });
    }

    const data = await registerPasienService({
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
    });

    return res.code(201).send({
      success: true,
      message: "Registrasi pasien berhasil",
      data,
    });

  } catch (error) {
    return res.code(400).send({
      success: false,
      message: error.message,
    });
  }
};
