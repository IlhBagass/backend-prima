import { consultationRoutes } from "./routes/consultation.route.js";

export default function (app) {
  app.register(consultationRoutes);
}

