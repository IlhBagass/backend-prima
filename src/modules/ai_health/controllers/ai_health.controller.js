import {
  analyzeHealthDataService,
  recommendDoctorBySymptomsService,
  symptomsAnalysisService,
} from "../service/ai_health.service.js";

const numOrNull = (v) => {
  if (v === "" || v === null || v === undefined) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

export const symptomsAnalysisController = async (req, reply) => {
  try {
    const payload = req.body || {};

    if (!payload.user_id) return reply.code(400).send({ success: false, message: "user_id wajib diisi" });
    if (!Array.isArray(payload.gejala) || payload.gejala.length === 0) {
      return reply.code(400).send({ success: false, message: "gejala wajib berupa array dan tidak boleh kosong" });
    }
    if (!payload.durasi) return reply.code(400).send({ success: false, message: "durasi wajib diisi" });

    const data = await symptomsAnalysisService({
      user_id: payload.user_id,
      gejala: payload.gejala,
      durasi: payload.durasi,
      suhu_tubuh: numOrNull(payload.suhu_tubuh),
      keluhan_tambahan: payload.keluhan_tambahan ?? null,
    });

    return reply.code(200).send({ success: true, data });
  } catch (error) {
    const msg = error.message || "Terjadi kesalahan";
    if (msg.includes("User tidak ditemukan")) return reply.code(404).send({ success: false, message: msg });
    return reply.code(500).send({ success: false, message: msg });
  }
};

export const analyzeHealthDataController = async (req, reply) => {
  try {
    const payload = req.body || {};

    if (!payload.user_id) return reply.code(400).send({ success: false, message: "user_id wajib diisi" });
    const tinggi_badan_cm = numOrNull(payload.tinggi_badan_cm);
    const berat_badan_kg = numOrNull(payload.berat_badan_kg);
    if (tinggi_badan_cm === null || tinggi_badan_cm <= 0) {
      return reply.code(400).send({ success: false, message: "tinggi_badan_cm wajib angka > 0" });
    }
    if (berat_badan_kg === null || berat_badan_kg <= 0) {
      return reply.code(400).send({ success: false, message: "berat_badan_kg wajib angka > 0" });
    }

    const data = await analyzeHealthDataService({
      user_id: payload.user_id,
      tinggi_badan_cm,
      berat_badan_kg,
      tekanan_darah: payload.tekanan_darah ?? null,
      gula_darah: numOrNull(payload.gula_darah),
      kolesterol: numOrNull(payload.kolesterol),
    });

    return reply.code(200).send({ success: true, data });
  } catch (error) {
    const msg = error.message || "Terjadi kesalahan";
    if (msg.includes("User tidak ditemukan")) return reply.code(404).send({ success: false, message: msg });
    return reply.code(500).send({ success: false, message: msg });
  }
};

export const recommendDoctorBySymptomsController = async (req, reply) => {
  try {
    const payload = req.body || {};

    if (!payload.user_id) return reply.code(400).send({ success: false, message: "user_id wajib diisi" });
    if (!Array.isArray(payload.gejala) || payload.gejala.length === 0) {
      return reply.code(400).send({ success: false, message: "gejala wajib berupa array dan tidak boleh kosong" });
    }

    const data = await recommendDoctorBySymptomsService({
      user_id: payload.user_id,
      gejala: payload.gejala,
      durasi: payload.durasi ?? null,
    });

    return reply.code(200).send({ success: true, data });
  } catch (error) {
    const msg = error.message || "Terjadi kesalahan";
    if (msg.includes("User tidak ditemukan")) return reply.code(404).send({ success: false, message: msg });
    return reply.code(500).send({ success: false, message: msg });
  }
};

