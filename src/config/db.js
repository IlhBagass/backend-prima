import { neon } from "@neondatabase/serverless";
import { getEnv } from "./env.js";

const databaseUrl = getEnv("DATABASE_URL");

export const sql = databaseUrl
  ? neon(databaseUrl)
  : () => {
      throw new Error(
        "Missing required environment variable: DATABASE_URL. Set it in Vercel Project Settings → Environment Variables, then redeploy."
      );
    };
