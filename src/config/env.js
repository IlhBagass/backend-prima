import dotenv from "dotenv";

dotenv.config();

const normalizeEnvValue = (value) => {
  if (typeof value !== "string") {
    return value;
  }

  return value.trim();
};

export const getEnv = (name) => normalizeEnvValue(process.env[name]);

export const getRequiredEnv = (name) => {
  const value = getEnv(name);

  if (!value) {
    throw new Error(
      `Missing required environment variable: ${name}. Check your backend runtime environment and redeploy after updating env values.`
    );
  }

  return value;
};