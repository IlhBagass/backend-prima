import "./config/env.js";
import Fastify from "fastify";
import registerPlugins from "./plugins/index.js";

const app = Fastify({logger: true})

await registerPlugins(app)

app.get("/",async () => {
    return { message: "API berhasil" };
});

export default app;