import { describe, expect, it } from "vitest";
import { applyForceDelay } from "./scenarios";

describe("applyForceDelay", () => {
  it("delays by the requested amount when ?forceDelay is present", async () => {
    const request = new Request("https://example.test/health?forceDelay=30");
    const start = Date.now();
    await applyForceDelay(request);
    expect(Date.now() - start).toBeGreaterThanOrEqual(25);
  });

  it("is a no-op without the param", async () => {
    const request = new Request("https://example.test/health");
    const start = Date.now();
    await applyForceDelay(request);
    expect(Date.now() - start).toBeLessThan(25);
  });
});
