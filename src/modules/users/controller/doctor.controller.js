import { registerDoctorService } from "../service/doctor.service.js";

export const registerDoctor = async (req, res) => {
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
      nomor_str,
      nomor_sip,
      spesialisasi,
      sub_spesialisasi,
      pengalaman_tahun,
      deskripsi_profil,
      biaya_konsultasi,
      nama_klinik,
      alamat_klinik,
    } = req.body;

    // Validasi field wajib
    if (!name || !email || !password || !nomor_str || !nomor_sip || !spesialisasi) {
      return res.code(400).send({
        success: false,
        message: "name, email, password, nomor_str, nomor_sip, dan spesialisasi wajib diisi",
      });
    }

    const data = await registerDoctorService({
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
    });

    return res.code(201).send({
      success: true,
      message: "Registrasi dokter berhasil, menunggu verifikasi STR & SIP",
      data,
    });

  } catch (error) {
    return res.code(400).send({
      success: false,
      message: error.message,
    });
  }
};
