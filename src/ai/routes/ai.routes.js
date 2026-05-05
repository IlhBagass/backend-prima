import { askController } from "../ai.controller.js";

export default async function (fastify) {
  fastify.post("/ask", askController);
}