import { randomBytes } from "node:crypto";

export const generateHexId = (bytes = 5) => randomBytes(bytes).toString("hex").toUpperCase();

