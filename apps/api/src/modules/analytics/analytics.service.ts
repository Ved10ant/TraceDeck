import { prisma } from "@tracedeck/database";

export interface LatencyMetrics {
  avgMs: number;
  p50Ms: number;
  p95Ms: number;
  p99Ms: number;
  minMs: number;
  maxMs: number;
}

export interface AnalyticsSummary {
  window: string;
  totalChecks: number;
  successfulChecks: number;
  failedChecks: number;
  uptimePercentage: number;
  latency: LatencyMetrics;
  monitorsCount: number;
  activeIncidentsCount: number;
  timeSeries: Array<{
    timestamp: string;
    avgLatencyMs: number;
    uptimePercentage: number;
    checksCount: number;
  }>;
}

export function calculatePercentile(sortedValues: number[], percentile: number): number {
  if (sortedValues.length === 0) return 0;
  if (sortedValues.length === 1) return sortedValues[0];
  const index = Math.ceil((percentile / 100) * sortedValues.length) - 1;
  const clampedIndex = Math.max(0, Math.min(index, sortedValues.length - 1));
  return sortedValues[clampedIndex];
}

export function parseWindowDurationMs(windowStr: string): number {
  switch (windowStr) {
    case "1h":
      return 60 * 60 * 1000;
    case "24h":
      return 24 * 60 * 60 * 1000;
    case "7d":
      return 7 * 24 * 60 * 60 * 1000;
    case "30d":
      return 30 * 24 * 60 * 60 * 1000;
    default:
      return 24 * 60 * 60 * 1000;
  }
}

export class AnalyticsService {
  private db: typeof prisma;

  constructor(customPrisma?: typeof prisma) {
    this.db = customPrisma || prisma;
  }

  /**
   * Computes high-level aggregated analytics for an entire organization.
   */
  async getOverview(organizationId: string, windowStr: string = "24h"): Promise<AnalyticsSummary> {
    const windowMs = parseWindowDurationMs(windowStr);
    const sinceDate = new Date(Date.now() - windowMs);

    const monitors = await this.db.monitor.findMany({
      where: { organizationId },
      select: { id: true },
    });

    const monitorIds = monitors.map((m) => m.id);

    if (monitorIds.length === 0) {
      return {
        window: windowStr,
        totalChecks: 0,
        successfulChecks: 0,
        failedChecks: 0,
        uptimePercentage: 100,
        latency: { avgMs: 0, p50Ms: 0, p95Ms: 0, p99Ms: 0, minMs: 0, maxMs: 0 },
        monitorsCount: 0,
        activeIncidentsCount: 0,
        timeSeries: [],
      };
    }

    const [results, activeIncidentsCount] = await Promise.all([
      this.db.monitorResult.findMany({
        where: {
          monitorId: { in: monitorIds },
          checkedAt: { gte: sinceDate },
        },
        orderBy: { checkedAt: "asc" },
      }),
      this.db.incident.count({
        where: {
          monitor: { organizationId },
          status: { not: "RESOLVED" },
        },
      }),
    ]);

    return this.aggregateResults(results, windowStr, windowMs, monitorIds.length, activeIncidentsCount);
  }

  /**
   * Computes detailed analytics for a specific monitor.
   */
  async getMonitorAnalytics(organizationId: string, monitorId: string, windowStr: string = "24h") {
    const monitor = await this.db.monitor.findFirst({
      where: { id: monitorId, organizationId },
    });

    if (!monitor) {
      const error: any = new Error("Monitor not found or access denied");
      error.statusCode = 404;
      error.code = "MONITOR_NOT_FOUND";
      throw error;
    }

    const windowMs = parseWindowDurationMs(windowStr);
    const sinceDate = new Date(Date.now() - windowMs);

    const [results, recentChecks, activeIncidents] = await Promise.all([
      this.db.monitorResult.findMany({
        where: {
          monitorId,
          checkedAt: { gte: sinceDate },
        },
        orderBy: { checkedAt: "asc" },
      }),
      this.db.monitorResult.findMany({
        where: { monitorId },
        orderBy: { checkedAt: "desc" },
        take: 50,
      }),
      this.db.incident.findMany({
        where: {
          monitorId,
          status: { not: "RESOLVED" },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    const summary = this.aggregateResults(results, windowStr, windowMs, 1, activeIncidents.length);

    return {
      monitor: {
        id: monitor.id,
        name: monitor.name,
        url: monitor.url,
        method: monitor.method,
        intervalSeconds: monitor.intervalSeconds,
        enabled: monitor.enabled,
        lastCheckedAt: monitor.lastCheckedAt,
      },
      summary,
      recentChecks,
      activeIncidents,
    };
  }

  /**
   * Aggregates raw check results into percentiles, uptime and time series buckets.
   */
  private aggregateResults(
    results: any[],
    windowStr: string,
    windowMs: number,
    monitorsCount: number,
    activeIncidentsCount: number
  ): AnalyticsSummary {
    const totalChecks = results.length;
    let successfulChecks = 0;
    const latencies: number[] = [];

    for (const res of results) {
      if (res.outcome === "SUCCESS") {
        successfulChecks++;
        if (typeof res.latencyMs === "number" && res.latencyMs >= 0) {
          latencies.push(res.latencyMs);
        }
      }
    }

    const failedChecks = totalChecks - successfulChecks;
    const uptimePercentage = totalChecks > 0 ? Number(((successfulChecks / totalChecks) * 100).toFixed(2)) : 100;

    // Percentiles
    latencies.sort((a, b) => a - b);
    const sumLatency = latencies.reduce((acc, val) => acc + val, 0);
    const avgMs = latencies.length > 0 ? Math.round(sumLatency / latencies.length) : 0;
    const p50Ms = calculatePercentile(latencies, 50);
    const p95Ms = calculatePercentile(latencies, 95);
    const p99Ms = calculatePercentile(latencies, 99);
    const minMs = latencies.length > 0 ? latencies[0] : 0;
    const maxMs = latencies.length > 0 ? latencies[latencies.length - 1] : 0;

    // Time-series bucketing (e.g. 12-24 buckets)
    const numBuckets = windowStr === "1h" ? 12 : windowStr === "24h" ? 24 : 14;
    const bucketDurationMs = windowMs / numBuckets;
    const now = Date.now();
    const startTime = now - windowMs;

    const buckets: Array<{
      timestamp: string;
      total: number;
      success: number;
      latencies: number[];
    }> = [];

    for (let i = 0; i < numBuckets; i++) {
      const bucketStart = new Date(startTime + i * bucketDurationMs);
      buckets.push({
        timestamp: bucketStart.toISOString(),
        total: 0,
        success: 0,
        latencies: [],
      });
    }

    for (const res of results) {
      const checkTime = new Date(res.checkedAt).getTime();
      const offset = checkTime - startTime;
      if (offset >= 0 && offset < windowMs) {
        const bucketIdx = Math.min(Math.floor(offset / bucketDurationMs), numBuckets - 1);
        buckets[bucketIdx].total++;
        if (res.outcome === "SUCCESS") {
          buckets[bucketIdx].success++;
          if (typeof res.latencyMs === "number") {
            buckets[bucketIdx].latencies.push(res.latencyMs);
          }
        }
      }
    }

    const timeSeries = buckets.map((b) => {
      const bucketUptime = b.total > 0 ? Number(((b.success / b.total) * 100).toFixed(1)) : 100;
      const bucketAvg = b.latencies.length > 0 ? Math.round(b.latencies.reduce((s, v) => s + v, 0) / b.latencies.length) : 0;
      return {
        timestamp: b.timestamp,
        avgLatencyMs: bucketAvg,
        uptimePercentage: bucketUptime,
        checksCount: b.total,
      };
    });

    return {
      window: windowStr,
      totalChecks,
      successfulChecks,
      failedChecks,
      uptimePercentage,
      latency: {
        avgMs,
        p50Ms,
        p95Ms,
        p99Ms,
        minMs,
        maxMs,
      },
      monitorsCount,
      activeIncidentsCount,
      timeSeries,
    };
  }
}

export const analyticsService = new AnalyticsService();
