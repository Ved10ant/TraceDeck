import { describe, it, expect, beforeEach, vi } from "vitest";
import { IncidentService } from "../modules/incidents/incidents.service";

describe("Incident State Machine (Phase D)", () => {
  let mockIncidents: any[] = [];
  let mockEvents: any[] = [];

  const mockPrisma: any = {
    incident: {
      create: async ({ data }: any) => {
        // Simulate PostgreSQL partial unique index constraint
        const activeExists = mockIncidents.some(
          (i) => i.monitorId === data.monitorId && i.status !== "RESOLVED"
        );
        if (activeExists) {
          const error: any = new Error("Unique constraint violation");
          error.code = "P2002";
          throw error;
        }
        const inc = { id: `inc-${Date.now()}`, ...data, createdAt: new Date(), updatedAt: new Date() };
        mockIncidents.push(inc);
        return inc;
      },
      findFirst: async ({ where }: any) => {
        return mockIncidents.find((i) => {
          if (where.monitorId && i.monitorId !== where.monitorId) return false;
          if (where.status?.not && i.status === where.status.not) return false;
          return true;
        }) || null;
      },
      update: async ({ where, data }: any) => {
        const idx = mockIncidents.findIndex((i) => i.id === where.id);
        if (idx === -1) throw new Error("Incident not found");
        mockIncidents[idx] = { ...mockIncidents[idx], ...data };
        return mockIncidents[idx];
      },
      findMany: async ({ where }: any) => {
        return mockIncidents.filter((i) => {
          if (where?.monitor?.organizationId && i.organizationId !== where.monitor.organizationId) return false;
          if (where?.status?.not && i.status === where.status.not) return false;
          if (where?.status && typeof where.status === "string" && i.status !== where.status) return false;
          return true;
        }).map((i) => ({ ...i, monitor: {}, events: [] }));
      },
    },
    incidentEvent: {
      create: async ({ data }: any) => {
        const event = { id: `evt-${Date.now()}`, ...data, createdAt: new Date() };
        mockEvents.push(event);
        return event;
      },
    },
  };

  let incidentService: IncidentService;

  beforeEach(() => {
    mockIncidents = [];
    mockEvents = [];
    incidentService = new IncidentService(mockPrisma);
  });

  describe("Failure Threshold: Auto-Open after 3 consecutive failures", () => {
    it("should NOT open incident on 1st or 2nd consecutive failure", async () => {
      const r1 = await incidentService.evaluate("mon-1", "Payments API", 1, 0);
      const r2 = await incidentService.evaluate("mon-1", "Payments API", 2, 0);

      expect(r1.action).toBe("none");
      expect(r2.action).toBe("none");
      expect(mockIncidents.length).toBe(0);
    });

    it("should auto-open incident on 3rd consecutive failure", async () => {
      const result = await incidentService.evaluate("mon-1", "Payments API", 3, 0);

      expect(result.action).toBe("opened");
      expect(result.incidentId).toBeDefined();
      expect(mockIncidents.length).toBe(1);
      expect(mockIncidents[0].status).toBe("INVESTIGATING");
      expect(mockIncidents[0].monitorId).toBe("mon-1");

      // Event timeline should be recorded
      expect(mockEvents.length).toBe(1);
      expect(mockEvents[0].eventType).toBe("OPENED");
    });

    it("should NOT open duplicate incident if one is already active (simulating concurrent workers)", async () => {
      // First worker creates the incident
      await incidentService.evaluate("mon-1", "Payments API", 3, 0);
      expect(mockIncidents.length).toBe(1);

      // Second worker hits the partial unique index constraint
      const result = await incidentService.evaluate("mon-1", "Payments API", 4, 0);
      expect(result.action).toBe("none");
      expect(mockIncidents.length).toBe(1); // Still only 1 active incident
    });
  });

  describe("Recovery Threshold: Auto-Resolve after 2 consecutive successes", () => {
    it("should NOT resolve incident after just 1 success", async () => {
      // Create an active incident first
      await incidentService.evaluate("mon-1", "Payments API", 3, 0);

      const result = await incidentService.evaluate("mon-1", "Payments API", 0, 1);
      expect(result.action).toBe("none");
      expect(mockIncidents[0].status).toBe("INVESTIGATING");
    });

    it("should auto-resolve incident after 2 consecutive successes", async () => {
      await incidentService.evaluate("mon-1", "Payments API", 3, 0);
      expect(mockIncidents[0].status).toBe("INVESTIGATING");

      const result = await incidentService.evaluate("mon-1", "Payments API", 0, 2);
      expect(result.action).toBe("resolved");
      expect(mockIncidents[0].status).toBe("RESOLVED");
      expect(mockIncidents[0].resolvedAt).toBeDefined();

      // Resolution event appended to timeline
      const resolveEvent = mockEvents.find((e) => e.eventType === "RESOLVED");
      expect(resolveEvent).toBeDefined();
    });

    it("should do nothing if successes reach threshold but no active incident exists", async () => {
      const result = await incidentService.evaluate("mon-1", "Payments API", 0, 2);
      expect(result.action).toBe("none");
      expect(mockIncidents.length).toBe(0);
    });
  });

  describe("Full Incident Lifecycle: Fail -> Incident -> Recover -> Resolve", () => {
    it("should walk through complete state transition", async () => {
      // 3 failures: incident opened
      await incidentService.evaluate("mon-1", "Payments API", 3, 0);
      expect(mockIncidents[0].status).toBe("INVESTIGATING");

      // 1 success: not enough to resolve
      await incidentService.evaluate("mon-1", "Payments API", 0, 1);
      expect(mockIncidents[0].status).toBe("INVESTIGATING");

      // 2nd consecutive success: auto-resolved
      await incidentService.evaluate("mon-1", "Payments API", 0, 2);
      expect(mockIncidents[0].status).toBe("RESOLVED");
      expect(mockIncidents[0].resolvedAt).toBeDefined();

      // Another incident can now open (old one is RESOLVED)
      await incidentService.evaluate("mon-1", "Payments API", 3, 0);
      expect(mockIncidents.length).toBe(2);
      expect(mockIncidents[1].status).toBe("INVESTIGATING");
    });
  });

  describe("Manual Status Transitions (Human-In-The-Loop)", () => {
    it("should allow manually transitioning incident from INVESTIGATING to IDENTIFIED", async () => {
      const extendedMockPrisma: any = {
        ...mockPrisma,
        incident: {
          ...mockPrisma.incident,
          findFirst: async ({ where }: any) => {
            const inc = mockIncidents.find((i) => i.id === where.id || i.monitorId === where?.monitorId);
            if (!inc) return null;
            return { ...inc, monitor: { organizationId: "org-1" } };
          },
        },
      };

      const service = new IncidentService(extendedMockPrisma);

      // Open an incident
      const opened = await service.evaluate("mon-1", "Auth API", 3, 0);
      const incidentId = opened.incidentId!;

      const updated = await service.updateIncidentStatus(
        "org-1",
        incidentId,
        "IDENTIFIED",
        "Root cause identified: Redis memory exhaustion on replica node"
      );

      expect(updated.status).toBe("IDENTIFIED");
      const event = mockEvents.find((e) => e.eventType === "STATUS_CHANGED");
      expect(event).toBeDefined();
      expect(event.message).toContain("Redis memory exhaustion");
    });
  });
});
