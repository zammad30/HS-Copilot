import { describe, expect, it } from "vitest";
import {
  formatBatchFeature,
  formatClassificationsFeature,
  formatPeopleFeature,
  formatPrice,
  formatRetention,
  formatRetentionFeature,
  hasBatchAccess,
} from "./formatPlan";

describe("formatPrice", () => {
  it("drops the cents for whole-dollar prices", () => {
    expect(formatPrice(0)).toBe("$0");
    expect(formatPrice(2000)).toBe("$20");
  });

  it("keeps two digits when there are cents", () => {
    expect(formatPrice(1499)).toBe("$14.99");
    expect(formatPrice(2999)).toBe("$29.99");
  });
});

describe("formatClassificationsFeature", () => {
  it("reads a lifetime period as in total", () => {
    expect(formatClassificationsFeature({ limit: 5, period: "lifetime" })).toBe(
      "5 classifications in total",
    );
  });

  it("reads a month period as per month, with thousands separators", () => {
    expect(formatClassificationsFeature({ limit: 500, period: "month" })).toBe(
      "500 classifications per month",
    );
    expect(formatClassificationsFeature({ limit: 1300, period: "month" })).toBe(
      "1,300 classifications per month",
    );
  });
});

describe("formatPeopleFeature", () => {
  it("uses the singular for one seat", () => {
    expect(formatPeopleFeature(1)).toBe("1 person");
  });

  it("reads several seats as up to N people", () => {
    expect(formatPeopleFeature(5)).toBe("Up to 5 people");
  });
});

describe("formatBatchFeature", () => {
  it("says No batch upload when the plan has no batch access", () => {
    const none = { uploadsPerMonth: 0, maxRows: 0 };
    expect(hasBatchAccess(none)).toBe(false);
    expect(formatBatchFeature(none)).toBe("No batch upload");
  });

  it("describes uploads and rows when batch is available", () => {
    const some = { uploadsPerMonth: 3, maxRows: 50 };
    expect(hasBatchAccess(some)).toBe(true);
    expect(formatBatchFeature(some)).toBe("3 batch uploads per month, up to 50 rows each");
  });
});

describe("formatRetention", () => {
  it("shows days under a year", () => {
    expect(formatRetention(30)).toBe("30 days");
  });

  it("shows exactly 365 days as 1 year", () => {
    expect(formatRetention(365)).toBe("1 year");
  });

  it("shows longer periods in months", () => {
    expect(formatRetention(730)).toBe("24 months");
    expect(formatRetention(1095)).toBe("36 months");
  });
});

describe("formatRetentionFeature", () => {
  it("prefixes the retention period", () => {
    expect(formatRetentionFeature(730)).toBe("Audit trail kept for 24 months");
  });
});
