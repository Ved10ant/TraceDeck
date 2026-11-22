import { describe, it, expect, beforeEach } from "vitest";
import { AnalyticsService, calculatePercentile } from "../modules/analytics/analytics.service";

describe("Analytics Engine & Percentiles (Phase F)", () => {
  describe("Percentile Calculation Algorithms (P50, P95, P99)", () => {
    it("should return 0 for empty array", () => {
      expect(calculatePercentile([], 50)).toBe(0);
      expect(calculatePercentile([], 95)).toBe(0);
      expect(calculatePercentile([], 99)).toBe(0);
    });

    it("should return the single value when array has 1 item", () => {
      expect(calculatePercentile([42], 50)).toBe(42);
      expect(calculatePercentile([42], 95)).toBe(42);
      expect(calculatePercentile([42], 99)).toBe(42);
    });

    it("should accurately compute P50, P95, P99 on a uniform distribution 1..100", () => {
      const values = Array.from({ length: 100 }, (_, i) => i + 1); // 1 to 100
      expect(calculatePercentile(values, 50)).toBe(50);
      expect(calculatePercentile(values, 95)).toBe(95);
      expect(calculatePercentile(values, 99)).toBe(99);
    });

    it("should compute accurate percentiles on skewed realistic latencies", () => {
      // 90 fast requests (10-30ms), 8 slow requests (150-200ms), 2 extreme outliers (1200ms, 2500ms)
      const fast = Array.from({ length: 90 }, () => 20);
      const slow = Array.from({ length: 8 }, () => 180);
      const spikes = [1200, 2500];
      const allLatencies = [...fast, ...slow, ...spikes].sort((a, b) => a - b);

      expect(calculatePercentile(allLatencies, 50)).toBe(20);
      expect(calculatePercentile(allLatencies, 95)).toBe(180);
      expect(calculatePercentile(allLatencies, 99)).toBe(1200);
    });
  });

  describe("Aggregated Overview Analytics", () => {
    let mockMonitors: any[] = [];
    let mockResults: any[] = [];
    let mockIncidents: any[] = [];

    const mockPrisma: any = {
      monitor: {
        findMany: async ({ where }: any) => {
          return mockMonitors.filter((m) => m.organizationId === where.organizationId);
        },
        findFirst: async ({ where }: any) => {
          return mockMonitors.find((m) => m.id === where.id && m.organizationId === where.organizationId) || null;
        },
      },
      monitorResult: {
        findMany: async ({ where, take }: any) => {
          let filtered = mockResults.filter((r) => {
            if (where?.monitorId?.in && !where.monitorId.in.includes(r.monitorId)) return false;
            if (where?.monitorId && typeof where.monitorId === "string" && r.monitorId !== where.monitorId) return false;
            if (where?.checkedAt?.gte && new Date(r.checkedAt) < where.checkedAt.gte) return false;
            return true;
          });
          if (take) filtered = filtered.slice(0, take);
          return filtered;
        },
      },
      incident: {
        count: async ({ where }: any) => {
          return mockIncidents.filter((i) => {
            if (where?.status?.not && i.status === where.status.not) return false;
            return true;
          }).length;
        },
        findMany: async ({ where }: any) => {
          return mockIncidents.filter((i) => {
            if (where?.monitorId && i.monitorId !== where.monitorId) return false;
            if (where?.status?.not && i.status === where.status.not) return false;
            return true;
          });
        },
      },
    };

    let service: AnalyticsService;

    beforeEach(() => {
      mockMonitors = [];
      mockResults = [];
      mockIncidents = [];
      service = new AnalyticsService(mockPrisma);
    });

    it("should return default empty summary when organization has no monitors", async () => {
      const summary = await service.getOverview("org-empty", "24h");
      expect(summary.monitorsCount).toBe(0);
      expect(summary.totalChecks).toBe(0);
      expect(summary.uptimePercentage).toBe(100);
      expect(summary.latency.avgMs).toBe(0);
      expect(summary.latency.p95Ms).toBe(0);
    });

    it("should calculate correct uptime % and latency metrics across checks", async () => {
      mockMonitors.push({ id: "mon-1", organizationId: "org-1", name: "Checkout API" });
      mockMonitors.push({ id: "mon-2", organizationId: "org-1", name: "Catalog API" });

      const now = new Date();
      // 8 SUCCESS with latencies 40, 50, 60, 70, 80, 90, 100, 200 ms
      const latencies = [40, 50, 60, 70, 80, 90, 100, 200];
      for (const lat of latencies) {
        mockResults.push({
          id: `r-${Math.random()}`,
          monitorId: "mon-1",
          outcome: "SUCCESS",
          statusCode: 200,
          latencyMs: lat,
          checkedAt: new Date(now.getTime() - 1000 * 60 * 5),
        });
      }

      // 2 FAILURES
      mockResults.push({
        id: "r-fail-1",
        monitorId: "mon-2",
        outcome: "FAILURE",
        statusCode: 500,
        latencyMs: 150,
        checkedAt: new Date(now.getTime() - 1000 * 60 * 2),
      });
      mockResults.push({
        id: "r-fail-2",
        monitorId: "mon-2",
        outcome: "TIMEOUT",
        statusCode: null,
        latencyMs: null,
        checkedAt: new Date(now.getTime() - 1000 * 60 * 1),
      });

      // Active incident
      mockIncidents.push({ id: "inc-1", status: "INVESTIGATING", monitorId: "mon-2" });

      const summary = await service.getOverview("org-1", "24h");

      expect(summary.monitorsCount).toBe(2);
      expect(summary.totalChecks).toBe(10);
      expect(summary.successfulChecks).toBe(8);
      expect(summary.failedChecks).toBe(2);
      expect(summary.uptimePercentage).toBe(80); // 8/10 = 80.00%
      expect(summary.activeIncidentsCount).toBe(1);

      // Average latency of the 8 successful checks: (40+50+60+70+80+90+100+200)/8 = 690/8 = 86ms
      expect(summary.latency.avgMs).toBe(86);
      expect(summary.latency.minMs).toBe(40);
      expect(summary.latency.maxMs).toBe(200);
      expect(summary.latency.p50Ms).toBe(70);
      expect(summary.timeSeries.length).toBeGreaterThan(0);
    });

    it("should return detailed analytics for a single monitor", async () => {
      mockMonitors.push({
        id: "mon-auth",
        organizationId: "org-1",
        name: "Auth Service",
        url: "https://auth.example.com/health",
        method: "GET",
        intervalSeconds: 60,
        enabled: true,
      });

      mockResults.push({
        id: "r-1",
        monitorId: "mon-auth",
        outcome: "SUCCESS",
        statusCode: 200,
        latencyMs: 35,
        checkedAt: new Date(),
      });

      const details = await service.getMonitorAnalytics("org-1", "mon-auth", "24h");

      expect(details.monitor.name).toBe("Auth Service");
      expect(details.summary.totalChecks).toBe(1);
      expect(details.summary.uptimePercentage).toBe(100);
      expect(details.summary.latency.p50Ms).toBe(35);
      expect(details.recentChecks.length).toBe(1);
    });

    it("should reject analytics request for non-existent monitor", async () => {
      await expect(
        service.getMonitorAnalytics("org-1", "mon-nonexistent", "24h")
      ).rejects.toThrow("Monitor not found");
    });
  });
});
