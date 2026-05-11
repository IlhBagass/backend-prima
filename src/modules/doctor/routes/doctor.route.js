import { getDoctorDetail, listDoctors } from "../controller/doctor.controller.js";

export default async function doctorRoutes(app) {
  app.get("/", listDoctors);
  app.get("/:id", getDoctorDetail);
}

