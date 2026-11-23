import { describe, expect, it } from "vitest";
import { expiringWindowDays } from "./expiringWindow";

describe("expiringWindowDays", () => {
  it("is 10 days on Free (30 days retention)", () => {
    expect(expiringWindowDays(30)).toBe(10);
  });

  it("is capped at 30 days on Solo (365 days retention)", () => {
    expect(expiringWindowDays(365)).toBe(30);
  });

  it("is capped at 30 days on Team (730 days retention)", () => {
    expect(expiringWindowDays(730)).toBe(30);
  });
});
