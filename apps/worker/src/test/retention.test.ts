import { describe, it, expect, beforeEach } from "vitest";
import { RetentionService } from "../retention";

describe("30-Day Retention Pruning Service (Phase C)", () => {
  let mockResults: any[] = [];

  const mockPrisma: any = {
    monitorResult: {
      deleteMany: async ({ where }: any) => {
        const initialCount = mockResults.length;
        mockResults = mockResults.filter((r) => {
          if (where.checkedAt?.lt && r.checkedAt < where.checkedAt.lt) {
            return false; // Deleted
          }
          return true; // Retained
        });
        return { count: initialCount - mockResults.length };
      },
    },
  };

  const retentionService = new RetentionService(mockPrisma);

  beforeEach(() => {
    mockResults = [];
  });

  it("should prune check records older than the specified retention window (30 days)", async () => {
    const now = new Date("2026-11-22T12:00:00Z");

    const oldDate = new Date("2026-10-20T12:00:00Z"); // 33 days old -> should be pruned
    const recentDate = new Date("2026-11-20T12:00:00Z"); // 2 days old -> should be retained

    mockResults = [
      { id: "res-old-1", checkedAt: oldDate },
      { id: "res-old-2", checkedAt: oldDate },
      { id: "res-recent-1", checkedAt: recentDate },
    ];

    const result = await retentionService.pruneOldResults(30, now);

    expect(result.deletedCount).toBe(2);
    expect(mockResults.length).toBe(1);
    expect(mockResults[0].id).toBe("res-recent-1");
  });
});
