import cors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";

import userModule from "../modules/users/index.js";
import uploadModule from "../ai/routes/upload.routes.js";
import askModule from "../ai/routes/ai.routes.js"
import aiRoutes from "../ai/routes/ai.routes.js";

export default async function registerPlugins(app) {
  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  });

  await app.register(userModule, { prefix: "/auth" });
  await app.register(aiRoutes,{prefix:"/ai"})
  await app.register(uploadModule,{prefix: "/upload"})
}