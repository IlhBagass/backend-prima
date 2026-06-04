import {
  analyzeHealthDataController,
  recommendDoctorBySymptomsController,
  symptomsAnalysisController,
} from "../controllers/ai_health.controller.js";

export default async function aiHealthRoutes(app) {
  // 1) Analisis Gejala
  app.post("/symptoms", symptomsAnalysisController);

  // 2) Analisis Data Kesehatan
  app.post("/analyze", analyzeHealthDataController);

  // 3) Rekomendasi Dokter by Gejala
  app.post("/recommend-doctor", recommendDoctorBySymptomsController);
}

