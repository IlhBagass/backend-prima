import { askAI } from "./ai.service.js";

export async function askController(req, reply) {
  try {
    const { question } = req.body;

    const result = await askAI({ question });

    return reply.send(result);
  } catch (err) {
    return reply.code(400).send({
      error: err.message
    });
  }
}
