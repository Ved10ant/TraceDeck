import dotenv from "dotenv";

dotenv.config();

export const workerConfig = {
  redisUrl: process.env.REDIS_URL || "redis://localhost:6379",
  concurrency: parseInt(process.env.CHECK_CONCURRENCY || "10", 10),
  schedulerIntervalMs: parseInt(process.env.SCHEDULER_INTERVAL_MS || "5000", 10),
  retentionDays: parseInt(process.env.RETENTION_DAYS || "30", 10),
  nodeEnv: process.env.NODE_ENV || "development",
};
