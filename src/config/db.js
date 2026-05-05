import { neon } from "@neondatabase/serverless"
import { getRequiredEnv } from "./env.js";

export const sql = neon(getRequiredEnv("DATABASE_URL"));