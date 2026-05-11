import scheduleRoutes from "./routes/schedule.route.js";

export default async function (app) {
  app.register(scheduleRoutes);
}

