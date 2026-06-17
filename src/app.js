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
        const { sql, initDatabase } = await import("./config/db.js");
        // Drop old messages table because it's completely wrong schema
        await sql`DROP TABLE IF EXISTS public.messages CASCADE;`;
        await initDatabase();
        const columns = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'messages'`;
        return reply.send({ success: true, columns });
    } catch (err) {
        return reply.code(500).send({ error: err.message, stack: err.stack });
    }
});

app.get("/db-query", async (req, reply) => {
    try {
        const { sql } = await import("./config/db.js");
        const result = await sql`SELECT * FROM messages LIMIT 1`;
        return reply.send({ success: true, result });
    } catch (err) {
        return reply.code(500).send({ error: err.message, stack: err.stack });
    }
});

export default app;