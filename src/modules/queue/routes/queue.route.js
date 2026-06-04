import {
  getQueuePositionByBookingController,
  getTodayQueueByDoctorController,
  callNextPatientController,
  updateQueueStatusController,
} from "../controllers/queue.controller.js";

export default async function queueRoutes(app) {
  // 1) Get Posisi Antrian (by Booking)
  app.get("/:booking_id", getQueuePositionByBookingController);

  // 2) Get List Antrian Hari Ini (by Dokter)
  app.get("/doctor/:doctor_id/today", getTodayQueueByDoctorController);

  // 3) Panggil Pasien Berikutnya
  app.patch("/doctor/:doctor_id/next", callNextPatientController);

  // 4) Update Status Antrian
  app.patch("/:booking_id/status", updateQueueStatusController);
}

