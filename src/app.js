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

app.get("/db-check", async (req, reply) => {
    try {
        const { sql } = await import("./config/db.js");
        await sql.unsafe(`ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS consultation_id UUID;`);
        const columns = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'messages'`;
        return reply.send({ success: true, columns });
    } catch (err) {
        return reply.code(500).send({ error: err.message });
    }
});

export default app;