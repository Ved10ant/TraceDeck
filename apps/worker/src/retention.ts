import { prisma } from "@tracedeck/database";
import { workerConfig } from "./config";

export class RetentionService {
  private db: typeof prisma;
  private timer: NodeJS.Timeout | null = null;

  constructor(customDb?: typeof prisma) {
    this.db = customDb || prisma;
  }

  /**
   * Prunes check records older than the retention window.
   */
  async pruneOldResults(
    retentionDays: number = workerConfig.retentionDays,
    now: Date = new Date()
  ) {
    const cutoff = new Date(now.getTime() - retentionDays * 24 * 60 * 60 * 1000);

    const result = await this.db.monitorResult.deleteMany({
      where: {
        checkedAt: {
          lt: cutoff,
        },
      },
    });

    console.log(
      `[Retention] Pruned ${result.count} check records older than ${cutoff.toISOString()} (${retentionDays} days)`
    );

    return {
      deletedCount: result.count,
      cutoff,
    };
  }

  start(intervalMs: number = 24 * 60 * 60 * 1000) {
    // Run initial prune, then schedule
    this.pruneOldResults().catch((err) => {
      console.error("[Retention] Initial pruning failed:", err);
    });

    this.timer = setInterval(() => {
      this.pruneOldResults().catch((err) => {
        console.error("[Retention] Scheduled pruning failed:", err);
      });
    }, intervalMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

export const retentionService = new RetentionService();
