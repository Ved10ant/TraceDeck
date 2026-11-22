import { Queue } from "bullmq";
import Redis from "ioredis";
import { workerConfig } from "./config";

export const MONITORING_QUEUE_NAME = "monitoring-queue";
export const NOTIFICATION_QUEUE_NAME = "notification-queue";

export interface CheckJobPayload {
  monitorId: string;
  organizationId: string;
  url: string;
  method: "GET" | "HEAD";
  timeoutSeconds: number;
  expectedStatusCodes: number[];
}

let redisConnection: Redis | null = null;

export function getRedisConnection(): Redis {
  if (!redisConnection) {
    redisConnection = new Redis(workerConfig.redisUrl, {
      maxRetriesPerRequest: null,
      lazyConnect: true,
    });
  }
  return redisConnection;
}

/**
 * Generates a deterministic BullMQ Job ID based on the monitor's interval bucket.
 * Guarantees that duplicate scheduling cannot occur across restarts or multiple scheduler ticks.
 */
export function generateJobId(
  monitorId: string,
  timestampMs: number = Date.now(),
  intervalSeconds: number = 300
): string {
  const bucketMs = Math.max(intervalSeconds, 10) * 1000;
  const bucket = Math.floor(timestampMs / bucketMs);
  return `check:${monitorId}:${bucket}`;
}

export function createMonitoringQueue(connection?: Redis): Queue<CheckJobPayload> {
  const conn = connection || getRedisConnection();
  return new Queue<CheckJobPayload>(MONITORING_QUEUE_NAME, {
    connection: conn as any,
    defaultJobOptions: {
      removeOnComplete: 100,
      removeOnFail: 200,
      attempts: 1, // Health checks are scheduled fresh rather than retried indefinitely
    },
  });
}
