import {
  createMedicalRecordController,
  getMedicalRecordsByPasienController,
  getMedicalRecordDetailController,
  updateMedicalRecordController,
  deleteMedicalRecordController,
} from "../controllers/medical.controller.js";

export default async function medicalRecordsRoutes(app) {
  app.post(
    "/",
    createMedicalRecordController
  );

  app.get(
    "/pasien/:pasien_id",
    getMedicalRecordsByPasienController
  );

  app.get(
    "/:id",
    getMedicalRecordDetailController
  );

  app.patch(
    "/:id",
    updateMedicalRecordController
  );

  app.delete(
    "/:id",
    deleteMedicalRecordController
  );
}