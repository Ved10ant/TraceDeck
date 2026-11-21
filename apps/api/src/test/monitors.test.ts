import { describe, it, expect, beforeEach } from "vitest";
import { MonitorsService } from "../modules/monitors/monitors.service";

describe("Monitors CRUD & Tenant Isolation (Phase B)", () => {
  let mockMonitors: any[] = [];

  const mockPrisma: any = {
    monitor: {
      create: async ({ data }: any) => {
        const item = {
          id: `mon-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          ...data,
          consecutiveFailures: 0,
          consecutiveSuccesses: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        mockMonitors.push(item);
        return item;
      },
      findMany: async ({ where, skip = 0, take = 20 }: any) => {
        return mockMonitors
          .filter((m) => {
            if (m.organizationId !== where.organizationId) return false;
            if (where.enabled !== undefined && m.enabled !== where.enabled) return false;
            return true;
          })
          .slice(skip, skip + take)
          .map((m) => ({ ...m, results: [] }));
      },
      count: async ({ where }: any) => {
        return mockMonitors.filter((m) => {
          if (m.organizationId !== where.organizationId) return false;
          if (where.enabled !== undefined && m.enabled !== where.enabled) return false;
          return true;
        }).length;
      },
      findFirst: async ({ where }: any) => {
        const found = mockMonitors.find(
          (m) => m.id === where.id && m.organizationId === where.organizationId
        );
        if (!found) return null;
        return { ...found, results: [], incidents: [] };
      },
      update: async ({ where, data }: any) => {
        const index = mockMonitors.findIndex((m) => m.id === where.id);
        if (index === -1) throw new Error("Not found");
        mockMonitors[index] = { ...mockMonitors[index], ...data, updatedAt: new Date() };
        return mockMonitors[index];
      },
      delete: async ({ where }: any) => {
        const index = mockMonitors.findIndex((m) => m.id === where.id);
        if (index === -1) throw new Error("Not found");
        mockMonitors.splice(index, 1);
        return { success: true };
      },
    },
  };

  const testMonitorsService = new MonitorsService(mockPrisma);

  const orgA = "org-alpha-uuid";
  const orgB = "org-beta-uuid";

  beforeEach(() => {
    mockMonitors = [];
  });

  describe("Monitor Creation & Validation", () => {
    it("should successfully create a valid monitor for an organization", async () => {
      const monitor = await testMonitorsService.createMonitor(orgA, {
        name: "Stripe Webhook API",
        url: "https://api.stripe.com/health",
        method: "GET",
        intervalSeconds: 60,
        timeoutSeconds: 5,
        expectedStatusCodes: [200],
      });

      expect(monitor.id).toBeDefined();
      expect(monitor.organizationId).toBe(orgA);
      expect(monitor.name).toBe("Stripe Webhook API");
      expect(monitor.url).toBe("https://api.stripe.com/health");
      expect(monitor.enabled).toBe(true);
    });

    it("should block monitor creation with SSRF loopback address (127.0.0.1)", async () => {
      await expect(
        testMonitorsService.createMonitor(orgA, {
          name: "Localhost Probe",
          url: "http://127.0.0.1:8080/metrics",
          method: "GET",
          intervalSeconds: 60,
          timeoutSeconds: 5,
          expectedStatusCodes: [200],
        })
      ).rejects.toThrow("blocked_destination");
    });

    it("should block monitor creation with cloud metadata address (169.254.169.254)", async () => {
      await expect(
        testMonitorsService.createMonitor(orgA, {
          name: "AWS Metadata Probe",
          url: "http://169.254.169.254/latest/meta-data/",
          method: "GET",
          intervalSeconds: 60,
          timeoutSeconds: 5,
          expectedStatusCodes: [200],
        })
      ).rejects.toThrow("blocked_destination");
    });

    it("should block monitor creation with private RFC1918 addresses", async () => {
      await expect(
        testMonitorsService.createMonitor(orgA, {
          name: "Internal Router Probe",
          url: "http://192.168.1.1/admin",
          method: "GET",
          intervalSeconds: 60,
          timeoutSeconds: 5,
          expectedStatusCodes: [200],
        })
      ).rejects.toThrow("blocked_destination");
    });

    it("should block monitor creation with disallowed non-HTTP protocols", async () => {
      await expect(
        testMonitorsService.createMonitor(orgA, {
          name: "Passwd Exfiltration",
          url: "file:///etc/passwd",
          method: "GET",
          intervalSeconds: 60,
          timeoutSeconds: 5,
          expectedStatusCodes: [200],
        })
      ).rejects.toThrow("blocked_scheme");
    });
  });

  describe("Tenant Isolation (Strict Multi-Tenant Scoping)", () => {
    it("should prevent Organization B from reading Organization A's monitor", async () => {
      const monitorA = await testMonitorsService.createMonitor(orgA, {
        name: "Private API Org A",
        url: "https://api.example.com/v1",
        method: "GET",
        intervalSeconds: 300,
        timeoutSeconds: 10,
        expectedStatusCodes: [200],
      });

      // Org A can read it
      const readA = await testMonitorsService.getMonitorById(orgA, monitorA.id);
      expect(readA.id).toBe(monitorA.id);

      // Org B is rejected with 404 / access denied
      await expect(
        testMonitorsService.getMonitorById(orgB, monitorA.id)
      ).rejects.toThrow("Monitor not found or access denied");
    });

    it("should prevent Organization B from updating Organization A's monitor", async () => {
      const monitorA = await testMonitorsService.createMonitor(orgA, {
        name: "Original Name",
        url: "https://api.example.com/v1",
        method: "GET",
        intervalSeconds: 300,
        timeoutSeconds: 10,
        expectedStatusCodes: [200],
      });

      await expect(
        testMonitorsService.updateMonitor(orgB, monitorA.id, { name: "Hacked Name" })
      ).rejects.toThrow("Monitor not found or access denied");
    });

    it("should prevent Organization B from deleting Organization A's monitor", async () => {
      const monitorA = await testMonitorsService.createMonitor(orgA, {
        name: "Do Not Delete",
        url: "https://api.example.com/v1",
        method: "GET",
        intervalSeconds: 300,
        timeoutSeconds: 10,
        expectedStatusCodes: [200],
      });

      await expect(
        testMonitorsService.deleteMonitor(orgB, monitorA.id)
      ).rejects.toThrow("Monitor not found or access denied");

      // Verify still exists in Org A
      const stillExists = await testMonitorsService.getMonitorById(orgA, monitorA.id);
      expect(stillExists.id).toBe(monitorA.id);
    });

    it("should only list monitors belonging to the requesting organization", async () => {
      await testMonitorsService.createMonitor(orgA, {
        name: "Monitor Org A 1",
        url: "https://a1.example.com",
        method: "GET",
        intervalSeconds: 60,
        timeoutSeconds: 5,
        expectedStatusCodes: [200],
      });
      await testMonitorsService.createMonitor(orgA, {
        name: "Monitor Org A 2",
        url: "https://a2.example.com",
        method: "GET",
        intervalSeconds: 60,
        timeoutSeconds: 5,
        expectedStatusCodes: [200],
      });
      await testMonitorsService.createMonitor(orgB, {
        name: "Monitor Org B 1",
        url: "https://b1.example.com",
        method: "GET",
        intervalSeconds: 60,
        timeoutSeconds: 5,
        expectedStatusCodes: [200],
      });

      const listA = await testMonitorsService.listMonitors(orgA, { page: 1, limit: 10 });
      expect(listA.monitors.length).toBe(2);
      expect(listA.monitors.every((m: any) => m.name.startsWith("Monitor Org A"))).toBe(true);

      const listB = await testMonitorsService.listMonitors(orgB, { page: 1, limit: 10 });
      expect(listB.monitors.length).toBe(1);
      expect(listB.monitors[0].name).toBe("Monitor Org B 1");
    });
  });

  describe("Monitor Update & Manual Check Dispatch", () => {
    it("should update monitor configuration and reject SSRF URLs during update", async () => {
      const monitor = await testMonitorsService.createMonitor(orgA, {
        name: "Initial Monitor",
        url: "https://initial.example.com",
        method: "GET",
        intervalSeconds: 60,
        timeoutSeconds: 5,
        expectedStatusCodes: [200],
      });

      const updated = await testMonitorsService.updateMonitor(orgA, monitor.id, {
        name: "Updated Monitor Name",
        enabled: false,
      });

      expect(updated.name).toBe("Updated Monitor Name");
      expect(updated.enabled).toBe(false);

      // Attempting to change URL to internal endpoint must fail
      await expect(
        testMonitorsService.updateMonitor(orgA, monitor.id, {
          url: "http://169.254.169.254",
        })
      ).rejects.toThrow("blocked_destination");
    });

    it("should trigger an asynchronous manual test and return accepted job metadata", async () => {
      const monitor = await testMonitorsService.createMonitor(orgA, {
        name: "Manual Test Target",
        url: "https://target.example.com/health",
        method: "GET",
        intervalSeconds: 300,
        timeoutSeconds: 10,
        expectedStatusCodes: [200],
      });

      const testResult = await testMonitorsService.triggerManualCheck(orgA, monitor.id);

      expect(testResult.message).toBe("Manual check queued successfully");
      expect(testResult.jobId).toContain(`manual-check:${monitor.id}:`);
      expect(testResult.monitorId).toBe(monitor.id);
    });

    it("should delete monitor successfully", async () => {
      const monitor = await testMonitorsService.createMonitor(orgA, {
        name: "To Be Deleted",
        url: "https://delete.example.com",
        method: "GET",
        intervalSeconds: 60,
        timeoutSeconds: 5,
        expectedStatusCodes: [200],
      });

      await testMonitorsService.deleteMonitor(orgA, monitor.id);

      await expect(
        testMonitorsService.getMonitorById(orgA, monitor.id)
      ).rejects.toThrow("Monitor not found or access denied");
    });
  });
});
