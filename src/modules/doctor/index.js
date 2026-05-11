import doctorRoutes from "./routes/doctor.route.js";

export default async function (app) {
  app.register(doctorRoutes);
}

