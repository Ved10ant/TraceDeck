import { prisma } from "@tracedeck/database";
import { CreateMonitorInput, UpdateMonitorInput, ListMonitorsQuery } from "./monitors.schemas";
import { validateUrlPrecheck } from "@tracedeck/shared";

export class MonitorsService {
  private db: typeof prisma;

  constructor(customPrisma?: typeof prisma) {
    this.db = customPrisma || prisma;
  }

  async createMonitor(organizationId: string, input: CreateMonitorInput) {
    // Validate URL through the shared SSRF pre-check
    validateUrlPrecheck(input.url);

    const monitor = await this.db.monitor.create({
      data: {
        organizationId,
        name: input.name,
        url: input.url,
        method: input.method as any,
        intervalSeconds: input.intervalSeconds,
        timeoutSeconds: input.timeoutSeconds,
        expectedStatusCodes: input.expectedStatusCodes,
        enabled: true,
        nextCheckAt: new Date(), // Due immediately
      },
    });

    return monitor;
  }

  async listMonitors(organizationId: string, query: ListMonitorsQuery) {
    const where: any = { organizationId };

    if (query.enabled !== undefined) {
      where.enabled = query.enabled === "true";
    }

    const skip = (query.page - 1) * query.limit;

    const [monitors, total] = await Promise.all([
      this.db.monitor.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: { createdAt: "desc" },
        include: {
          results: {
            take: 1,
            orderBy: { checkedAt: "desc" },
          },
        },
      }),
      this.db.monitor.count({ where }),
    ]);

    const formatted = monitors.map((m: any) => {
      const lastResult = m.results[0];
      return {
        id: m.id,
        name: m.name,
        url: m.url,
        method: m.method,
        intervalSeconds: m.intervalSeconds,
        timeoutSeconds: m.timeoutSeconds,
        expectedStatusCodes: m.expectedStatusCodes,
        enabled: m.enabled,
        lastCheckedAt: m.lastCheckedAt,
        status: m.consecutiveFailures > 0 ? "DEGRADED" : "HEALTHY",
        lastResult: lastResult
          ? {
              outcome: lastResult.outcome,
              statusCode: lastResult.statusCode,
              latencyMs: lastResult.latencyMs,
              checkedAt: lastResult.checkedAt,
            }
          : null,
      };
    });

    return {
      monitors: formatted,
      pagination: {
        page: query.page,
        limit: query.limit,
        total,
        totalPages: Math.ceil(total / query.limit),
      },
    };
  }

  async getMonitorById(organizationId: string, monitorId: string) {
    const monitor = await this.db.monitor.findFirst({
      where: {
        id: monitorId,
        organizationId, // Strict tenant scoping
      },
      include: {
        results: {
          take: 20,
          orderBy: { checkedAt: "desc" },
        },
        incidents: {
          take: 5,
          orderBy: { startedAt: "desc" },
        },
      },
    });

    if (!monitor) {
      const error: any = new Error("Monitor not found or access denied");
      error.statusCode = 404;
      error.code = "MONITOR_NOT_FOUND";
      throw error;
    }

    return monitor;
  }

  async updateMonitor(organizationId: string, monitorId: string, input: UpdateMonitorInput) {
    // If URL is being updated, ensure it passes SSRF checks
    if (input.url) {
      validateUrlPrecheck(input.url);
    }

    // Verify ownership first
    await this.getMonitorById(organizationId, monitorId);

    const updated = await this.db.monitor.update({
      where: { id: monitorId },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.url !== undefined ? { url: input.url } : {}),
        ...(input.method !== undefined ? { method: input.method as any } : {}),
        ...(input.intervalSeconds !== undefined ? { intervalSeconds: input.intervalSeconds } : {}),
        ...(input.timeoutSeconds !== undefined ? { timeoutSeconds: input.timeoutSeconds } : {}),
        ...(input.expectedStatusCodes !== undefined ? { expectedStatusCodes: input.expectedStatusCodes } : {}),
        ...(input.enabled !== undefined ? { enabled: input.enabled } : {}),
      },
    });

    return updated;
  }

  async deleteMonitor(organizationId: string, monitorId: string) {
    // Verify ownership first
    await this.getMonitorById(organizationId, monitorId);

    await this.db.monitor.delete({
      where: { id: monitorId },
    });

    return { success: true };
  }

  async triggerManualCheck(organizationId: string, monitorId: string) {
    const monitor = await this.getMonitorById(organizationId, monitorId);

    // Create an asynchronous job identifier
    const jobId = `manual-check:${monitor.id}:${Date.now()}`;

    // Update nextCheckAt to now so background worker picks it up immediately
    await this.db.monitor.update({
      where: { id: monitorId },
      data: {
        nextCheckAt: new Date(),
      },
    });

    return {
      message: "Manual check queued successfully",
      jobId,
      monitorId: monitor.id,
    };
  }
}

export const monitorsService = new MonitorsService();
