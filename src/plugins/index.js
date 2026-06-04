import cors from "@fastify/cors";
import fastifyMultipart from "@fastify/multipart";

import userModule from "../modules/users/index.js";
import scheduleModule from "../modules/schedule/index.js";
import doctorModule from "../modules/doctor/index.js";
import uploadModule from "../ai/routes/upload.routes.js";
import askModule from "../ai/routes/ai.routes.js"
import aiRoutes from "../ai/routes/ai.routes.js";
import medicalModule from "../modules/medical_records/index.js"
import prescriptionModule from "../modules/prescription/index.js"
import documentModule from "../modules/document/index.js"
import immunizationModule from "../modules/immunization/index.js"
import programModule from "../modules/programs/index.js"
import consultationModule from "../modules/consultations/index.js"
import calculatorModule from "../modules/calculator/index.js"
import queueModule from "../modules/queue/index.js"
import notificationModule from "../modules/notifications/index.js"
import aiHealthModule from "../modules/ai_health/index.js"
import reviewModule from "../modules/reviews/index.js"
import reportModule from "../modules/reports/index.js"

export default async function registerPlugins(app) {
  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 2 * 1024 * 1024, 
    },
  });

  await app.register(userModule, { prefix: "/auth" });
  await app.register(scheduleModule, { prefix: "/schedules" });
  await app.register(doctorModule, { prefix: "/doctors" });
  await app.register(aiRoutes,{prefix:"/ai"});
  await app.register(uploadModule,{prefix: "/upload"});
  await app.register(medicalModule,{prefix:"/medical"});
  await app.register(prescriptionModule,{prefix:"/prescription"}); 
  await app.register(documentModule,{prefix:"/document"}) 
  await app.register(immunizationModule,{prefix:"/immunization"})
  await app.register(programModule,{prefix:"/programs"})
  await app.register(consultationModule, { prefix: "/consultations" })
  await app.register(calculatorModule, { prefix: "/calculator" })
  await app.register(queueModule, { prefix: "/queue" })
  await app.register(notificationModule, { prefix: "/notifications" })
  await app.register(aiHealthModule, { prefix: "/ai/health" })
  await app.register(reviewModule, { prefix: "/reviews" })
  await app.register(reportModule, { prefix: "/reports" })
}
