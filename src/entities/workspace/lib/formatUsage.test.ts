import { describe, expect, it } from "vitest";
import {
  formatBatchUsage,
  formatClassificationsQuotaLine,
  formatClassificationsUsage,
  formatResetsOn,
  formatUsageCount,
} from "./formatUsage";

const NOW = new Date("2026-11-22T12:00:00");

describe("formatUsageCount", () => {
  it("joins used and limit with thousands separators", () => {
    expect(formatUsageCount(3, 1300)).toBe("3 of 1,300");
  });

  it("allows used to exceed the limit after a downgrade", () => {
    expect(formatUsageCount(8, 5)).toBe("8 of 5");
  });
});

describe("formatResetsOn", () => {
  it("reads a future date with a single 'on'", () => {
    const text = formatResetsOn("2026-11-30T12:00:00", NOW);
    expect(text).toBe("Resets on Nov 30");
    expect(text).not.toMatch(/on on/);
  });

  it("reads the same day as today, without 'on'", () => {
    expect(formatResetsOn("2026-11-22T20:00:00", NOW)).toBe("Resets today");
  });
});

describe("formatClassificationsQuotaLine", () => {
  it("adds the reset date for a monthly plan", () => {
    const line = formatClassificationsQuotaLine(
      3,
      { limit: 1300, period: "month" },
      { periodEnd: "2026-11-30T12:00:00", now: NOW },
    );
    expect(line).toBe("3 of 1,300 classifications used this month. Resets on Nov 30.");
    expect(line).not.toMatch(/on on/);
  });

  it("says Resets today on the last day of the period", () => {
    const line = formatClassificationsQuotaLine(
      3,
      { limit: 500, period: "month" },
      { periodEnd: "2026-11-22T20:00:00", now: NOW },
    );
    expect(line).toBe("3 of 500 classifications used this month. Resets today.");
  });

  it("omits the reset date when a monthly plan has no periodEnd", () => {
    expect(formatClassificationsQuotaLine(3, { limit: 500, period: "month" })).toBe(
      "3 of 500 classifications used this month.",
    );
  });

  it("reads a lifetime plan as in total, with no reset date", () => {
    expect(
      formatClassificationsQuotaLine(
        3,
        { limit: 5, period: "lifetime" },
        { periodEnd: "2026-11-30T12:00:00", now: NOW },
      ),
    ).toBe("3 of 5 classifications used in total.");
  });
});

describe("formatClassificationsUsage", () => {
  it("reads per month or in total", () => {
    expect(formatClassificationsUsage(3, { limit: 1300, period: "month" })).toBe(
      "3 of 1,300 per month",
    );
    expect(formatClassificationsUsage(3, { limit: 5, period: "lifetime" })).toBe("3 of 5 in total");
  });
});

describe("formatBatchUsage", () => {
  it("says Not included when the plan has no batch access", () => {
    expect(formatBatchUsage(0, { uploadsPerMonth: 0, maxRows: 0 })).toBe("Not included");
  });

  it("describes uploads used and the row cap", () => {
    expect(formatBatchUsage(1, { uploadsPerMonth: 10, maxRows: 500 })).toBe(
      "1 of 10 this month, up to 500 rows each",
    );
  });
});
