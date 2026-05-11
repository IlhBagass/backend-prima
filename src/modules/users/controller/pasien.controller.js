import { registerPasienService, updatePasienProfileByIdService } from "../service/pasien.service.js";

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

export const updatePasienProfileById = async (req, reply) => {
  try {
    const { id } = req.params;
    const data = await updatePasienProfileByIdService(id, req.body || {});
    if (!data) {
      return reply
        .code(404)
        .send({ success: false, message: "Profil pasien tidak ditemukan / role bukan pasien" });
    }
    return reply.send({ success: true, message: "Profil pasien berhasil diupdate", data });
  } catch (error) {
    return reply.code(400).send({ success: false, message: error.message });
  }
};
