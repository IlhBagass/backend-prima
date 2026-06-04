import {
  exportCsvController,
  exportPdfController,
  reportAppointmentsController,
  reportConsultationsController,
  reportMedicalRecordsController,
  reportRevenueController,
  reportUsersController,
} from "../controllers/report.controller.js";

export default async function reportRoutes(app) {
  // 1) Laporan Pengguna
  app.get("/users", reportUsersController);

  // 2) Laporan Janji Temu
  app.get("/appointments", reportAppointmentsController);

  // 3) Laporan Konsultasi
  app.get("/consultations", reportConsultationsController);

  // 4) Laporan Rekam Medis
  app.get("/medical-records", reportMedicalRecordsController);

  // 5) Laporan Pendapatan Dokter
  app.get("/revenue", reportRevenueController);

  // 6) Export PDF
  app.get("/export/pdf", exportPdfController);

  // 7) Export CSV
  app.get("/export/csv", exportCsvController);
}

