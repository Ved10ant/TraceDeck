import { Worker, Job } from "bullmq";
import Redis from "ioredis";
import { prisma, CheckOutcome } from "@tracedeck/database";
import { safeCheck } from "@tracedeck/shared";
import { CheckJobPayload, MONITORING_QUEUE_NAME, getRedisConnection } from "./queue";
import { workerConfig } from "./config";

export interface CheckExecutionResult {
  monitorId: string;
  outcome: CheckOutcome;
  statusCode?: number;
  latencyMs?: number;
  errorCode?: string;
  incidentAction?: "opened" | "resolved" | "none";
  incidentId?: string;
}

export interface IncidentEvaluator {
  evaluate(monitorId: string, monitorName: string, failures: number, successes: number): Promise<{ action: string; incidentId?: string }>;
}

export class MonitoringWorkerService {
  private db: typeof prisma;
  private worker: Worker<CheckJobPayload> | null = null;
  private customSafeCheck?: typeof safeCheck;
  private incidentEvaluator?: IncidentEvaluator;

  constructor(customDb?: typeof prisma, customCheck?: typeof safeCheck, incidentEval?: IncidentEvaluator) {
    this.db = customDb || prisma;
    this.customSafeCheck = customCheck;
    this.incidentEvaluator = incidentEval;
  }

  /**
   * Processes a single monitoring check job.
   */
  async processJob(job: { data: CheckJobPayload }): Promise<CheckExecutionResult> {
    const { monitorId, url, method, timeoutSeconds, expectedStatusCodes } = job.data;
    const checkFn = this.customSafeCheck || safeCheck;

    let outcome: CheckOutcome = "SUCCESS";
    let statusCode: number | undefined;
    let latencyMs: number | undefined;
    let errorCode: string | undefined;

    try {
      const res = await checkFn(url, {
        method,
        timeoutMs: timeoutSeconds * 1000,
      });

      statusCode = res.statusCode;
      latencyMs = res.latencyMs;

      if (expectedStatusCodes.includes(statusCode)) {
        outcome = "SUCCESS";
      } else {
        outcome = "FAILURE";
        errorCode = `HTTP_${statusCode}`;
      }
    } catch (err: any) {
      const msg = err.message || "";
      if (msg.includes("blocked_destination") || msg.includes("blocked_scheme")) {
        outcome = "SSRF_BLOCKED";
        errorCode = "SSRF_SECURITY_BLOCK";
      } else if (msg.includes("timeout") || err.code === "UND_ERR_HEADERS_TIMEOUT") {
        outcome = "TIMEOUT";
        errorCode = "REQUEST_TIMEOUT";
      } else {
        outcome = "FAILURE";
        errorCode = err.code || "NETWORK_ERROR";
      }
    }

    const isSuccess = outcome === "SUCCESS";

    // 1. Persist result in MonitorResult
    await this.db.monitorResult.create({
      data: {
        monitorId,
        outcome,
        statusCode,
        latencyMs,
        errorCode,
        checkedAt: new Date(),
      },
    });

    // 2. Update Monitor state & failure counters, then read back fresh counters
    const updatedMonitor = await this.db.monitor.update({
      where: { id: monitorId },
      data: {
        lastCheckedAt: new Date(),
        consecutiveFailures: isSuccess ? 0 : { increment: 1 },
        consecutiveSuccesses: isSuccess ? { increment: 1 } : 0,
      },
    });

    // 3. Evaluate incident state machine with fresh counters
    let incidentAction: "opened" | "resolved" | "none" = "none";
    let incidentId: string | undefined;

    if (this.incidentEvaluator) {
      const incidentResult = await this.incidentEvaluator.evaluate(
        monitorId,
        (updatedMonitor as any).name || monitorId,
        updatedMonitor.consecutiveFailures,
        updatedMonitor.consecutiveSuccesses
      );
      incidentAction = incidentResult.action as any;
      incidentId = incidentResult.incidentId;
    }

    return {
      monitorId,
      outcome,
      statusCode,
      latencyMs,
      errorCode,
      incidentAction,
      incidentId,
    };
  }

  start(connection?: Redis) {
    const conn = connection || getRedisConnection();

    this.worker = new Worker<CheckJobPayload>(
      MONITORING_QUEUE_NAME,
      async (job: Job<CheckJobPayload>) => {
        return this.processJob(job);
      },
      {
        connection: conn as any,
        concurrency: workerConfig.concurrency,
      }
    );

    this.worker.on("completed", (job) => {
      console.log(`[Monitoring Worker] Job ${job.id} completed for monitor ${job.data.monitorId}`);
    });

    this.worker.on("failed", (job, err) => {
      console.error(`[Monitoring Worker] Job ${job?.id} failed:`, err);
    });

    console.log(
      `[Monitoring Worker] Started listening on '${MONITORING_QUEUE_NAME}' with concurrency ${workerConfig.concurrency}`
    );
  }

  async close() {
    if (this.worker) {
      await this.worker.close();
      this.worker = null;
      console.log("[Monitoring Worker] Closed.");
    }
  }
}

export const monitoringWorkerService = new MonitoringWorkerService();

