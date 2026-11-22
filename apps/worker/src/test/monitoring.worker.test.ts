import { describe, it, expect, beforeEach, vi } from "vitest";
import { MonitoringWorkerService } from "../monitoring.worker";
import { CheckJobPayload } from "../queue";

describe("Monitoring Worker Execution & Result Persistence (Phase C)", () => {
  let mockResults: any[] = [];
  let mockMonitors: any[] = [];

  const mockPrisma: any = {
    monitorResult: {
      create: async ({ data }: any) => {
        const item = { id: `res-${Date.now()}`, ...data };
        mockResults.push(item);
        return item;
      },
    },
    monitor: {
      update: async ({ where, data }: any) => {
        const idx = mockMonitors.findIndex((m) => m.id === where.id);
        if (idx !== -1) {
          const current = mockMonitors[idx];
          const newFailures =
            typeof data.consecutiveFailures === "object"
              ? current.consecutiveFailures + 1
              : data.consecutiveFailures;
          const newSuccesses =
            typeof data.consecutiveSuccesses === "object"
              ? current.consecutiveSuccesses + 1
              : data.consecutiveSuccesses;

          mockMonitors[idx] = {
            ...current,
            ...data,
            consecutiveFailures: newFailures,
            consecutiveSuccesses: newSuccesses,
          };
          return mockMonitors[idx];
        }
        throw new Error("Monitor not found");
      },
    },
  };

  beforeEach(() => {
    mockResults = [];
    mockMonitors = [
      {
        id: "mon-1",
        consecutiveFailures: 0,
        consecutiveSuccesses: 0,
        lastCheckedAt: null,
      },
    ];
  });

  const baseJobData: CheckJobPayload = {
    monitorId: "mon-1",
    organizationId: "org-1",
    url: "https://api.example.com/health",
    method: "GET",
    timeoutSeconds: 5,
    expectedStatusCodes: [200],
  };

  it("should record SUCCESS when endpoint returns expected status code", async () => {
    const mockCheck = vi.fn(async () => ({ statusCode: 200, latencyMs: 145 }));
    const workerService = new MonitoringWorkerService(mockPrisma, mockCheck as any);

    const result = await workerService.processJob({ data: baseJobData });

    expect(result.outcome).toBe("SUCCESS");
    expect(result.statusCode).toBe(200);
    expect(result.latencyMs).toBe(145);

    // Verify DB persistence
    expect(mockResults.length).toBe(1);
    expect(mockResults[0].outcome).toBe("SUCCESS");
    expect(mockResults[0].latencyMs).toBe(145);

    // Verify failure counter reset and success increment
    expect(mockMonitors[0].consecutiveFailures).toBe(0);
    expect(mockMonitors[0].consecutiveSuccesses).toBe(1);
    expect(mockMonitors[0].lastCheckedAt).toBeDefined();
  });

  it("should record FAILURE when endpoint returns unexpected HTTP status (e.g. 500)", async () => {
    const mockCheck = vi.fn(async () => ({ statusCode: 500, latencyMs: 80 }));
    const workerService = new MonitoringWorkerService(mockPrisma, mockCheck as any);

    const result = await workerService.processJob({ data: baseJobData });

    expect(result.outcome).toBe("FAILURE");
    expect(result.statusCode).toBe(500);
    expect(result.errorCode).toBe("HTTP_500");

    expect(mockResults[0].outcome).toBe("FAILURE");
    expect(mockMonitors[0].consecutiveFailures).toBe(1);
    expect(mockMonitors[0].consecutiveSuccesses).toBe(0);
  });

  it("should classify SSRF blocked destinations appropriately without crashing worker", async () => {
    const mockCheck = vi.fn(async () => {
      throw new Error("blocked_destination");
    });
    const workerService = new MonitoringWorkerService(mockPrisma, mockCheck as any);

    const result = await workerService.processJob({ data: baseJobData });

    expect(result.outcome).toBe("SSRF_BLOCKED");
    expect(result.errorCode).toBe("SSRF_SECURITY_BLOCK");

    expect(mockResults[0].outcome).toBe("SSRF_BLOCKED");
    expect(mockMonitors[0].consecutiveFailures).toBe(1);
  });

  it("should classify network timeouts without throwing unhandled exceptions", async () => {
    const mockCheck = vi.fn(async () => {
      const err: any = new Error("Headers Timeout Error");
      err.code = "UND_ERR_HEADERS_TIMEOUT";
      throw err;
    });
    const workerService = new MonitoringWorkerService(mockPrisma, mockCheck as any);

    const result = await workerService.processJob({ data: baseJobData });

    expect(result.outcome).toBe("TIMEOUT");
    expect(result.errorCode).toBe("REQUEST_TIMEOUT");

    expect(mockResults[0].outcome).toBe("TIMEOUT");
    expect(mockMonitors[0].consecutiveFailures).toBe(1);
  });
});
