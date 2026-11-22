import { prisma, IncidentStatus, IncidentEventType } from "@tracedeck/database";

// Thresholds (Revision 1.1 spec)
const FAILURE_THRESHOLD = 3;  // consecutive failures to open an incident
const RECOVERY_THRESHOLD = 2; // consecutive successes to resolve an incident

export interface IncidentTransitionResult {
  action: "opened" | "resolved" | "none";
  incidentId?: string;
}

export class IncidentService {
  private db: typeof prisma;

  constructor(customPrisma?: typeof prisma) {
    this.db = customPrisma || prisma;
  }

  /**
   * Evaluates incident state after a monitor check result.
   * Called by the monitoring worker after persisting each MonitorResult.
   * Handles ACID deduplication via PostgreSQL partial unique index on (monitorId WHERE status != RESOLVED).
   */
  async evaluate(
    monitorId: string,
    monitorName: string,
    consecutiveFailures: number,
    consecutiveSuccesses: number
  ): Promise<IncidentTransitionResult> {

    // --- Scenario 1: Should we OPEN a new incident? ---
    if (consecutiveFailures >= FAILURE_THRESHOLD) {
      return this.tryOpenIncident(monitorId, monitorName, consecutiveFailures);
    }

    // --- Scenario 2: Should we RESOLVE an existing active incident? ---
    if (consecutiveSuccesses >= RECOVERY_THRESHOLD) {
      return this.tryResolveIncident(monitorId, consecutiveSuccesses);
    }

    return { action: "none" };
  }

  private async tryOpenIncident(
    monitorId: string,
    monitorName: string,
    consecutiveFailures: number
  ): Promise<IncidentTransitionResult> {
    try {
      const incident = await this.db.incident.create({
        data: {
          monitorId,
          title: `${monitorName} is unreachable`,
          severity: "CRITICAL",
          status: "INVESTIGATING",
          startedAt: new Date(),
        },
      });

      await this.db.incidentEvent.create({
        data: {
          incidentId: incident.id,
          eventType: "OPENED",
          message: `Incident auto-opened after ${consecutiveFailures} consecutive check failures.`,
        },
      });

      return { action: "opened", incidentId: incident.id };
    } catch (err: any) {
      // PostgreSQL partial unique index violation (P2002) = incident already active.
      // This is the expected race-condition guard. Handle silently and idempotently.
      if (err.code === "P2002" || (err.message && err.message.includes("unique"))) {
        return { action: "none" };
      }
      throw err;
    }
  }

  private async tryResolveIncident(
    monitorId: string,
    consecutiveSuccesses: number
  ): Promise<IncidentTransitionResult> {
    const activeIncident = await this.db.incident.findFirst({
      where: {
        monitorId,
        status: { not: "RESOLVED" },
      },
    });

    if (!activeIncident) {
      return { action: "none" };
    }

    await this.db.incident.update({
      where: { id: activeIncident.id },
      data: {
        status: "RESOLVED",
        resolvedAt: new Date(),
      },
    });

    await this.db.incidentEvent.create({
      data: {
        incidentId: activeIncident.id,
        eventType: "RESOLVED",
        message: `Incident auto-resolved after ${consecutiveSuccesses} consecutive successful checks.`,
      },
    });

    return { action: "resolved", incidentId: activeIncident.id };
  }

  async listIncidents(organizationId: string, statusFilter?: string) {
    const where: any = {
      monitor: { organizationId },
    };

    if (statusFilter === "ACTIVE") {
      where.status = { not: "RESOLVED" };
    } else if (statusFilter === "RESOLVED") {
      where.status = "RESOLVED";
    }

    return this.db.incident.findMany({
      where,
      orderBy: { startedAt: "desc" },
      include: {
        monitor: { select: { id: true, name: true, url: true } },
        events: { orderBy: { createdAt: "asc" }, take: 10 },
      },
    });
  }

  async getIncidentById(organizationId: string, incidentId: string) {
    const incident = await this.db.incident.findFirst({
      where: {
        id: incidentId,
        monitor: { organizationId },
      },
      include: {
        monitor: { select: { id: true, name: true, url: true } },
        events: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!incident) {
      const error: any = new Error("Incident not found or access denied");
      error.statusCode = 404;
      error.code = "INCIDENT_NOT_FOUND";
      throw error;
    }

    return incident;
  }

  async updateIncidentStatus(
    organizationId: string,
    incidentId: string,
    newStatus: IncidentStatus,
    message: string
  ) {
    const incident = await this.getIncidentById(organizationId, incidentId);

    const updated = await this.db.incident.update({
      where: { id: incident.id },
      data: {
        status: newStatus,
        ...(newStatus === "RESOLVED" ? { resolvedAt: new Date() } : {}),
      },
    });

    await this.db.incidentEvent.create({
      data: {
        incidentId: incident.id,
        eventType: "STATUS_CHANGED",
        message,
      },
    });

    return updated;
  }
}

export const incidentService = new IncidentService();
