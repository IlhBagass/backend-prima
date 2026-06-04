import queueRoutes from "./routes/queue.route.js";

export default function (app) {
  app.register(queueRoutes);
}

