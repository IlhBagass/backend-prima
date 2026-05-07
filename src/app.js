import "./config/env.js";
import Fastify from "fastify";
import registerPlugins from "./plugins/index.js";
import { initDatabase } from "./config/db.js";

const app = Fastify({logger: true})

await initDatabase();
await registerPlugins(app)

app.get("/",async () => {
    return { message: "API berhasil" };
});

export default app;