import {
  calculateBmi,
  calculateBmr,
  calculateDiabetesRisk,
  calculateHipertensiRisk,
} from "../service/calculator.service.js";

const num = (v) => (v === "" || v === null || v === undefined ? NaN : Number(v));

export const bmiController = async (req, reply) => {
  try {
    const payload = req.body || {};
    const tinggi_cm = num(payload.tinggi_cm);
    const berat_kg = num(payload.berat_kg);

    if (!Number.isFinite(tinggi_cm) || tinggi_cm <= 0) {
      return reply.code(400).send({ success: false, message: "tinggi_cm harus berupa angka > 0" });
    }
    if (!Number.isFinite(berat_kg) || berat_kg <= 0) {
      return reply.code(400).send({ success: false, message: "berat_kg harus berupa angka > 0" });
    }

    const data = calculateBmi({ tinggi_cm, berat_kg });
    return reply.code(200).send({ success: true, data });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
};

export const diabetesRiskController = async (req, reply) => {
  try {
    const payload = req.body || {};
    const umur = num(payload.umur);
    const berat_kg = num(payload.berat_kg);
    const tinggi_cm = num(payload.tinggi_cm);
    const gula_darah = num(payload.gula_darah);
    const riwayat_keluarga = Boolean(payload.riwayat_keluarga);
    const aktifitas_fisik = (payload.aktifitas_fisik || "").toString().toLowerCase();

    if (!Number.isFinite(umur) || umur <= 0) {
      return reply.code(400).send({ success: false, message: "umur harus berupa angka > 0" });
    }
    if (!Number.isFinite(berat_kg) || berat_kg <= 0) {
      return reply.code(400).send({ success: false, message: "berat_kg harus berupa angka > 0" });
    }
    if (!Number.isFinite(tinggi_cm) || tinggi_cm <= 0) {
      return reply.code(400).send({ success: false, message: "tinggi_cm harus berupa angka > 0" });
    }
    if (!Number.isFinite(gula_darah) || gula_darah <= 0) {
      return reply.code(400).send({ success: false, message: "gula_darah harus berupa angka > 0" });
    }
    if (!["rendah", "sedang", "tinggi"].includes(aktifitas_fisik)) {
      return reply.code(400).send({
        success: false,
        message: "aktifitas_fisik harus salah satu dari: rendah | sedang | tinggi",
      });
    }

    const data = calculateDiabetesRisk({
      umur,
      berat_kg,
      tinggi_cm,
      gula_darah,
      riwayat_keluarga,
      aktifitas_fisik,
    });

    return reply.code(200).send({ success: true, data });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
};

export const hipertensiRiskController = async (req, reply) => {
  try {
    const payload = req.body || {};
    const umur = num(payload.umur);
    const tekanan_sistolik = num(payload.tekanan_sistolik);
    const tekanan_diastolik = num(payload.tekanan_diastolik);
    const merokok = Boolean(payload.merokok);
    const riwayat_keluarga = Boolean(payload.riwayat_keluarga);

    if (!Number.isFinite(umur) || umur <= 0) {
      return reply.code(400).send({ success: false, message: "umur harus berupa angka > 0" });
    }
    if (!Number.isFinite(tekanan_sistolik) || tekanan_sistolik <= 0) {
      return reply.code(400).send({ success: false, message: "tekanan_sistolik harus berupa angka > 0" });
    }
    if (!Number.isFinite(tekanan_diastolik) || tekanan_diastolik <= 0) {
      return reply.code(400).send({ success: false, message: "tekanan_diastolik harus berupa angka > 0" });
    }

    const data = calculateHipertensiRisk({
      umur,
      tekanan_sistolik,
      tekanan_diastolik,
      merokok,
      riwayat_keluarga,
    });

    return reply.code(200).send({ success: true, data });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
};

export const bmrController = async (req, reply) => {
  try {
    const payload = req.body || {};
    const umur = num(payload.umur);
    const berat_kg = num(payload.berat_kg);
    const tinggi_cm = num(payload.tinggi_cm);
    const jenis_kelamin = (payload.jenis_kelamin || "").toString().toLowerCase();
    const aktifitas_fisik = (payload.aktifitas_fisik || "").toString().toLowerCase();

    if (!Number.isFinite(umur) || umur <= 0) {
      return reply.code(400).send({ success: false, message: "umur harus berupa angka > 0" });
    }
    if (!Number.isFinite(berat_kg) || berat_kg <= 0) {
      return reply.code(400).send({ success: false, message: "berat_kg harus berupa angka > 0" });
    }
    if (!Number.isFinite(tinggi_cm) || tinggi_cm <= 0) {
      return reply.code(400).send({ success: false, message: "tinggi_cm harus berupa angka > 0" });
    }
    if (!["pria", "wanita", "male", "female", "laki-laki", "perempuan"].includes(jenis_kelamin)) {
      return reply.code(400).send({
        success: false,
        message: "jenis_kelamin harus salah satu dari: pria | wanita",
      });
    }
    if (!["rendah", "sedang", "tinggi"].includes(aktifitas_fisik)) {
      return reply.code(400).send({
        success: false,
        message: "aktifitas_fisik harus salah satu dari: rendah | sedang | tinggi",
      });
    }

    const normalizedGender = ["pria", "male", "laki-laki"].includes(jenis_kelamin) ? "pria" : "wanita";
    const data = calculateBmr({
      umur,
      berat_kg,
      tinggi_cm,
      jenis_kelamin: normalizedGender,
      aktifitas_fisik,
    });
    return reply.code(200).send({ success: true, data });
  } catch (error) {
    return reply.code(500).send({ success: false, message: error.message });
  }
};

