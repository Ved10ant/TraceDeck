import dotenv from "dotenv";
import { schedulerService } from "./scheduler";
import { monitoringWorkerService } from "./monitoring.worker";
import { retentionService } from "./retention";
import { createMonitoringQueue, getRedisConnection } from "./queue";
import { workerConfig } from "./config";

dotenv.config();

export function getWorkerStatus() {
  return {
    status: "ready",
    config: {
      concurrency: workerConfig.concurrency,
      schedulerIntervalMs: workerConfig.schedulerIntervalMs,
      retentionDays: workerConfig.retentionDays,
    },
  };
}

async function bootstrap() {
  console.log("⚡ Starting TraceDeck Background Worker Service...");

  const redis = getRedisConnection();
  const queue = createMonitoringQueue(redis);

  // Wire queue into scheduler
  schedulerService.setQueue(queue);

  // Start background components
  monitoringWorkerService.start(redis);
  schedulerService.start(workerConfig.schedulerIntervalMs);
  retentionService.start();

  console.log("✅ TraceDeck Worker Service running successfully.");

  const shutdown = async (signal: string) => {
    console.log(`\n[Worker] Received ${signal}. Shutting down gracefully...`);
    schedulerService.stop();
    retentionService.stop();
    await monitoringWorkerService.close();
    await queue.close();
    await redis.quit();
    console.log("[Worker] Graceful shutdown complete.");
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));
}

if (process.env.NODE_ENV !== "test" && require.main === module) {
  bootstrap().catch((err) => {
    console.error("FATAL: Failed to start TraceDeck Worker:", err);
    process.exit(1);
  });
}
