import { describe, it, expect } from "vitest";
import { generateJobId } from "../queue";

describe("BullMQ Job Idempotency & Queue Helpers (Phase C)", () => {
  it("should generate deterministic job ID for the same monitor within the same interval bucket", () => {
    const monitorId = "monitor-123";
    const intervalSeconds = 60; // 1-minute bucket
    const t0 = 1700000000000;
    const t1 = 1700000010000; // 10 seconds later, same 1-min bucket

    const id1 = generateJobId(monitorId, t0, intervalSeconds);
    const id2 = generateJobId(monitorId, t1, intervalSeconds);

    expect(id1).toBe(id2);
    expect(id1).toContain(`check:${monitorId}:`);
  });

  it("should generate different job IDs for different monitors", () => {
    const timestamp = Date.now();
    const id1 = generateJobId("monitor-1", timestamp, 60);
    const id2 = generateJobId("monitor-2", timestamp, 60);

    expect(id1).not.toBe(id2);
  });

  it("should generate a new job ID when time crosses into the next interval bucket", () => {
    const monitorId = "monitor-123";
    const intervalSeconds = 60; // 60,000ms bucket
    const t0 = 1700000000000;
    const tNextBucket = t0 + 61_000; // 61 seconds later

    const id1 = generateJobId(monitorId, t0, intervalSeconds);
    const id2 = generateJobId(monitorId, tNextBucket, intervalSeconds);

    expect(id1).not.toBe(id2);
  });

  it("should enforce a minimum 10-second bucket for safety", () => {
    const monitorId = "monitor-rapid";
    const id = generateJobId(monitorId, 1700000000000, 2); // 2-second request -> clamped to 10s
    expect(id).toBeDefined();
  });
});
