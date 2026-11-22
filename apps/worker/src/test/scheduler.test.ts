import { describe, it, expect, beforeEach, vi } from "vitest";
import { SchedulerService } from "../scheduler";

describe("Scheduler Engine & Duplicate Prevention (Phase C)", () => {
  let mockMonitors: any[] = [];
  let queuedJobs: any[] = [];

  const mockPrisma: any = {
    monitor: {
      findMany: async ({ where }: any) => {
        return mockMonitors.filter((m) => {
          if (where.enabled !== undefined && m.enabled !== where.enabled) return false;
          if (where.nextCheckAt?.lte && m.nextCheckAt > where.nextCheckAt.lte) return false;
          return true;
        });
      },
      update: async ({ where, data }: any) => {
        const idx = mockMonitors.findIndex((m) => m.id === where.id);
        if (idx !== -1) {
          mockMonitors[idx] = { ...mockMonitors[idx], ...data };
          return mockMonitors[idx];
        }
        throw new Error("Monitor not found");
      },
    },
  };

  const mockQueue: any = {
    add: vi.fn(async (name: string, data: any, opts: any) => {
      queuedJobs.push({ name, data, opts });
      return { id: opts?.jobId || "job-1" };
    }),
  };

  let scheduler: SchedulerService;

  beforeEach(() => {
    mockMonitors = [];
    queuedJobs = [];
    vi.clearAllMocks();
    scheduler = new SchedulerService({ db: mockPrisma, queue: mockQueue });
  });

  it("should discover due monitors and enqueue check jobs with deterministic job IDs", async () => {
    const now = new Date("2026-11-22T10:00:00Z");

    mockMonitors = [
      {
        id: "mon-1",
        organizationId: "org-1",
        name: "Due Monitor",
        url: "https://api.example.com",
        method: "GET",
        intervalSeconds: 60,
        timeoutSeconds: 5,
        expectedStatusCodes: [200],
        enabled: true,
        nextCheckAt: new Date("2026-11-22T09:59:00Z"), // Due (1 min ago)
      },
      {
        id: "mon-2",
        organizationId: "org-1",
        name: "Future Monitor",
        url: "https://future.example.com",
        method: "GET",
        intervalSeconds: 300,
        timeoutSeconds: 10,
        expectedStatusCodes: [200],
        enabled: true,
        nextCheckAt: new Date("2026-11-22T10:05:00Z"), // Not due yet
      },
      {
        id: "mon-3",
        organizationId: "org-1",
        name: "Disabled Monitor",
        url: "https://disabled.example.com",
        method: "GET",
        intervalSeconds: 60,
        timeoutSeconds: 5,
        expectedStatusCodes: [200],
        enabled: false, // Disabled
        nextCheckAt: new Date("2026-11-22T09:50:00Z"),
      },
    ];

    const scheduledCount = await scheduler.tick(now);

    expect(scheduledCount).toBe(1);
    expect(queuedJobs.length).toBe(1);
    expect(queuedJobs[0].data.monitorId).toBe("mon-1");
    expect(queuedJobs[0].opts.jobId).toContain("check:mon-1:");

    // Verify nextCheckAt was advanced by intervalSeconds (60s)
    const updatedMon1 = mockMonitors.find((m) => m.id === "mon-1");
    expect(updatedMon1.nextCheckAt.getTime()).toBe(now.getTime() + 60 * 1000);
  });

  it("should prevent duplicate scheduling if scheduler ticks again immediately", async () => {
    const now = new Date("2026-11-22T10:00:00Z");

    mockMonitors = [
      {
        id: "mon-1",
        organizationId: "org-1",
        name: "Due Monitor",
        url: "https://api.example.com",
        method: "GET",
        intervalSeconds: 60,
        timeoutSeconds: 5,
        expectedStatusCodes: [200],
        enabled: true,
        nextCheckAt: new Date("2026-11-22T09:59:00Z"),
      },
    ];

    // First tick schedules it
    const count1 = await scheduler.tick(now);
    expect(count1).toBe(1);
    expect(queuedJobs.length).toBe(1);

    // Immediate second tick (nextCheckAt is now in the future)
    const count2 = await scheduler.tick(now);
    expect(count2).toBe(0);
    expect(queuedJobs.length).toBe(1); // No duplicate job added
  });
});
