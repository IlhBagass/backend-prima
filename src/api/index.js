import "../config/env.js";
import Fastify from "fastify";
import registerPlugin from "../plugins/index.js";

const app = Fastify({ logger: false }); 

const initApp = async () => {
  await registerPlugin(app);

  app.get("/", async () => {
    return { message: "API berhasil" };
  });

  await app.ready();
  return app;
};

const appPromise = initApp();

export default async function handler(req, res) {
  try {
    const fastify = await appPromise;
    fastify.server.emit("request", req, res);
  } catch (error) {
    res.statusCode = 500;
    res.setHeader("content-type", "application/json");
    res.end(
      JSON.stringify({
        status: "error",
        message: error?.message || "Failed to initialize server function",
      })
    );
  }
}