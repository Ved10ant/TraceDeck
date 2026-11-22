import { Queue } from "bullmq";
import { prisma } from "@tracedeck/database";
import { CheckJobPayload, generateJobId } from "./queue";

export interface SchedulerDependencies {
  db: typeof prisma;
  queue: Queue<CheckJobPayload>;
}

export class SchedulerService {
  private db: typeof prisma;
  private queue: Queue<CheckJobPayload>;
  private timer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(deps?: SchedulerDependencies) {
    this.db = deps?.db || prisma;
    this.queue = deps?.queue as any;
  }

  setQueue(queue: Queue<CheckJobPayload>) {
    this.queue = queue;
  }

  /**
   * Identifies all active monitors due for a check (nextCheckAt <= now).
   */
  async findDueMonitors(now: Date = new Date()) {
    return this.db.monitor.findMany({
      where: {
        enabled: true,
        nextCheckAt: {
          lte: now,
        },
      },
    });
  }

  /**
   * Enqueues an individual health check job with deterministic jobId,
   * then advances nextCheckAt atomically to prevent duplicate scheduling.
   */
  async scheduleMonitorCheck(monitor: any, now: Date = new Date()) {
    const jobId = generateJobId(monitor.id, now.getTime(), monitor.intervalSeconds);

    if (this.queue) {
      await this.queue.add(
        "http-check",
        {
          monitorId: monitor.id,
          organizationId: monitor.organizationId,
          url: monitor.url,
          method: monitor.method,
          timeoutSeconds: monitor.timeoutSeconds,
          expectedStatusCodes: monitor.expectedStatusCodes,
        },
        {
          jobId,
        }
      );
    }

    // Advance nextCheckAt by interval
    const nextCheckAt = new Date(now.getTime() + monitor.intervalSeconds * 1000);

    await this.db.monitor.update({
      where: { id: monitor.id },
      data: { nextCheckAt },
    });

    return { jobId, nextCheckAt };
  }

  /**
   * Runs a single scheduler tick.
   */
  async tick(now: Date = new Date()): Promise<number> {
    const dueMonitors = await this.findDueMonitors(now);

    for (const monitor of dueMonitors) {
      try {
        await this.scheduleMonitorCheck(monitor, now);
      } catch (err) {
        console.error(`[Scheduler] Failed to schedule check for monitor ${monitor.id}:`, err);
      }
    }

    return dueMonitors.length;
  }

  start(intervalMs: number = 5000) {
    if (this.isRunning) return;
    this.isRunning = true;

    console.log(`[Scheduler] Started. Polling every ${intervalMs}ms`);

    const runLoop = async () => {
      if (!this.isRunning) return;
      try {
        await this.tick();
      } catch (err) {
        console.error("[Scheduler] Error during tick:", err);
      }
      if (this.isRunning) {
        this.timer = setTimeout(runLoop, intervalMs);
      }
    };

    this.timer = setTimeout(runLoop, 0);
  }

  stop() {
    this.isRunning = false;
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    console.log("[Scheduler] Stopped.");
  }
}

export const schedulerService = new SchedulerService();
