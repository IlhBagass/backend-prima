import {
  createReviewController,
  getReviewByIdController,
  getDoctorInsightController,
  listReviewsByDoctorController,
  listReviewsByPasienController,
} from "../controllers/review.controller.js";

export default async function reviewRoutes(app) {
  // 1) Buat Ulasan + Analisis Sentimen
  app.post("/", createReviewController);

  // 2) Get List Ulasan (by Dokter)
  app.get("/doctor/:doctor_id", listReviewsByDoctorController);

  // 4) Get Insight Dokter (AI Summary)
  app.get("/doctor/:doctor_id/insight", getDoctorInsightController);

  // 5) Get List Ulasan (by Pasien)
  app.get("/pasien/:pasien_id", listReviewsByPasienController);

  // 3) Get Detail Ulasan
  app.get("/:id", getReviewByIdController);
}

