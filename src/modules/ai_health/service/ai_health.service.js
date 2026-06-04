import { sql } from "../../../config/db.js";
import { calculateBmi } from "../../calculator/service/calculator.service.js";
import { listDoctorsService } from "../../doctor/service/doctor.service.js";
import { callMaiaJson } from "../utils/maia.js";

const DISCLAIMER =
  "Informasi ini hanya panduan awal, bukan pengganti diagnosis medis. Jika gejala berat/berbahaya atau memburuk, segera ke IGD atau konsultasi dokter.";

const computeAge = (tanggal_lahir) => {
  if (!tanggal_lahir) return null;
  const d = new Date(String(tanggal_lahir));
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  let age = today.getUTCFullYear() - d.getUTCFullYear();
  const m = today.getUTCMonth() - d.getUTCMonth();
  if (m < 0 || (m === 0 && today.getUTCDate() < d.getUTCDate())) age--;
  return Number.isFinite(age) && age >= 0 ? age : null;
};

const getPatientContext = async (userId) => {
  const rows = await sql.query(
    `
      SELECT id, name, tanggal_lahir, riwayat_penyakit, riwayat_alergi
      FROM users
      WHERE id = $1
        AND deleted_at IS NULL
      LIMIT 1
    `,
    [userId]
  );
  const u = rows[0];
  if (!u) throw new Error("User tidak ditemukan");
  return {
    nama: u.name ?? null,
    umur: computeAge(u.tanggal_lahir),
    riwayat_penyakit: u.riwayat_penyakit ?? null,
    riwayat_alergi: u.riwayat_alergi ?? null,
  };
};

export const symptomsAnalysisService = async ({ user_id, gejala, durasi, suhu_tubuh, keluhan_tambahan }) => {
  const patient_context = await getPatientContext(user_id);

  const aiInput = {
    patient_context,
    input: {
      gejala,
      durasi,
      suhu_tubuh,
      keluhan_tambahan,
    },
  };

  const analysis = await callMaiaJson({
    task: "Analisis Gejala",
    schema_hint: {
      possible_conditions: [{ name: "string", likelihood: "Rendah|Sedang|Tinggi" }],
      what_you_can_do_now: ["string"],
      when_to_see_doctor: ["string"],
      recommended_specialist: { spesialisasi: "string", alasan: "string" },
      health_insight: { title: "string", description: "string" },
      disclaimer: "string",
    },
    user_payload: aiInput,
    disclaimer: DISCLAIMER,
  });

  return {
    patient_context,
    analysis: {
      ...analysis,
      disclaimer: DISCLAIMER,
    },
    disclaimer: DISCLAIMER,
  };
};

export const analyzeHealthDataService = async ({
  user_id,
  tinggi_badan_cm,
  berat_badan_kg,
  tekanan_darah,
  gula_darah,
  kolesterol,
}) => {
  await getPatientContext(user_id);

  const bmiCalc = calculateBmi({ tinggi_cm: tinggi_badan_cm, berat_kg: berat_badan_kg });

  const aiInput = {
    input: {
      tinggi_badan_cm,
      berat_badan_kg,
      bmi: { value: bmiCalc.bmi, status: bmiCalc.status },
      tekanan_darah: tekanan_darah ?? null,
      gula_darah,
      kolesterol,
    },
  };

  const analysis = await callMaiaJson({
    task: "Analisis Data Kesehatan",
    schema_hint: {
      bmi: { value: "number", status: "string" },
      tekanan_darah: { value: "string|null", status: "string" },
      gula_darah: { value: "number|null", status: "string" },
      kolesterol: { value: "number|null", status: "string" },
      overall_status: "string",
      recommendations: ["string"],
      recommended_specialist: { spesialisasi: "string", alasan: "string" },
      health_insight: { title: "string", description: "string" },
      disclaimer: "string",
    },
    user_payload: aiInput,
    disclaimer: DISCLAIMER,
  });

  // pastikan BMI sesuai hasil kalkulasi backend
  analysis.bmi = { value: bmiCalc.bmi, status: bmiCalc.status };
  analysis.disclaimer = DISCLAIMER;

  return {
    analysis,
    disclaimer: DISCLAIMER,
  };
};

export const recommendDoctorBySymptomsService = async ({ user_id, gejala, durasi }) => {
  await getPatientContext(user_id);

  const aiInput = { input: { gejala, durasi } };

  const ai = await callMaiaJson({
    task: "Rekomendasi Dokter by Gejala",
    schema_hint: {
      kemungkinan_kondisi: ["string"],
      recommended_specialist: { spesialisasi: "string", alasan: "string" },
      disclaimer: "string",
    },
    user_payload: aiInput,
    disclaimer: DISCLAIMER,
  });

  const specialist = ai?.recommended_specialist?.spesialisasi ? String(ai.recommended_specialist.spesialisasi) : "";
  const doctors = specialist
    ? await listDoctorsService({ spesialisasi: specialist, limit: 20, offset: 0 })
    : await listDoctorsService({ limit: 20, offset: 0 });

  return {
    kemungkinan_kondisi: Array.isArray(ai.kemungkinan_kondisi) ? ai.kemungkinan_kondisi : [],
    recommended_specialist: ai.recommended_specialist || { spesialisasi: specialist || "Dokter Umum", alasan: "" },
    available_doctors: doctors,
    disclaimer: DISCLAIMER,
  };
};
