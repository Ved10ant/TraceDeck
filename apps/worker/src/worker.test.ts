import { describe, it, expect } from "vitest";
import { getWorkerStatus } from "./index";

describe("Worker Initialization", () => {
  it("should initialize worker service in ready state", () => {
    const status = getWorkerStatus();
    expect(status.status).toBe("ready");
  });
});
