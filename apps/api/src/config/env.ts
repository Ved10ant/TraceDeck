import { z } from "zod";
import dotenv from "dotenv";

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  JWT_SECRET: z
    .string()
    .min(16, "JWT_SECRET must be at least 16 characters long"),
  DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().default("redis://localhost:6379"),
  ALLOW_PRIVATE_TARGETS: z
    .string()
    .transform((v) => v === "true")
    .default("false"),
});

export const env = envSchema.parse({
  PORT: process.env.PORT,
  NODE_ENV: process.env.NODE_ENV,
  JWT_SECRET:
    process.env.JWT_SECRET ||
    "f4b2e58b7891218c042224c82059be262b3753785d51010142b7a6df268523e5",
  DATABASE_URL: process.env.DATABASE_URL,
  REDIS_URL: process.env.REDIS_URL,
  ALLOW_PRIVATE_TARGETS: process.env.ALLOW_PRIVATE_TARGETS,
});

// SupaBase PassWord: TraCeDeck@69
