import notificationRoutes from "./routes/notification.route.js";

export default function (app) {
  app.register(notificationRoutes);
}

