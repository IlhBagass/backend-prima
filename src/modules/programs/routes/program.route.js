import {
  cancelRegistrationController,
  createProgramController,
  deleteProgramController,
  getProgramDetailController,
  listParticipantsController,
  listProgramsController,
  registerParticipantController,
  updateParticipantStatusController,
  updateProgramController,
} from "../controllers/program.controller.js";

export async function programRoutes(app) {
  // 1) Buat Program Kesehatan
  app.post("/", createProgramController);

  // 2) Get List Program
  app.get("/", listProgramsController);

  // 3) Get Detail Program
  app.get("/:id", getProgramDetailController);

  // 4) Update Program
  app.patch("/:id", updateProgramController);

  // 5) Hapus Program (Soft Delete)
  app.delete("/:id", deleteProgramController);

  // 6) Daftar sebagai Peserta
  app.post("/:id/register", registerParticipantController);

  // 7) Batalkan Pendaftaran
  app.delete("/:id/register/:pasien_id", cancelRegistrationController);

  // 8) Get List Peserta (by Program)
  app.get("/:id/participants", listParticipantsController);

  // 9) Update Status Peserta
  app.patch("/:id/participants/:pasien_id", updateParticipantStatusController);
}
