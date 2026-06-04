import {
  createConsultationController,
  deleteConsultationController,
  getConsultationDetailController,
  listConsultationsByDoctorController,
  listConsultationsByPasienController,
  listMessagesController,
  markMessagesReadController,
  sendMessageController,
  updateConsultationStatusController,
  uploadChatFileController,
} from "../controllers/consultation.controller.js";

export async function consultationRoutes(app) {
  // 1) Buat Room Konsultasi
  app.post("/", createConsultationController);

  // 2) Get List Konsultasi (by Pasien)
  app.get("/pasien/:pasien_id", listConsultationsByPasienController);

  // 3) Get List Konsultasi (by Dokter)
  app.get("/doctor/:doctor_id", listConsultationsByDoctorController);

  // 4) Get Detail Konsultasi
  app.get("/:id", getConsultationDetailController);

  // 5) Update Status Konsultasi
  app.patch("/:id/status", updateConsultationStatusController);

  // 6) Hapus Konsultasi (Soft Delete)
  app.delete("/:id", deleteConsultationController);

  // 7) Kirim Pesan
  app.post("/:id/messages", sendMessageController);

  // 8) Get List Pesan
  app.get("/:id/messages", listMessagesController);

  // 9) Tandai Pesan Dibaca
  app.patch("/:id/messages/read", markMessagesReadController);

  // 10) Upload File di Chat
  app.post("/:id/upload", uploadChatFileController);
}

