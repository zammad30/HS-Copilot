import { describe, expect, it } from "vitest";
import { formatDay, formatRelativeStart, formatTime, formatUpdatedDay } from "./formatDate";

const NOW = new Date("2026-11-19T15:30:00.000Z");

describe("formatTime", () => {
  it("formats a time from today without the date", () => {
    const result = formatTime(new Date("2026-11-19T09:18:00.000Z").toISOString(), NOW);
    expect(result).not.toContain("Nov");
    expect(result.length).toBeGreaterThan(0);
  });

  it("includes the month and day for a time from another day", () => {
    const result = formatTime(new Date("2026-11-12T09:18:00.000Z").toISOString(), NOW);
    expect(result).toContain("Nov");
  });
});

describe("formatDay", () => {
  it("returns 'today' for the same calendar day", () => {
    expect(formatDay(new Date("2026-11-19T09:18:00.000Z").toISOString(), NOW)).toBe("today");
  });

  it("returns 'yesterday' for the previous calendar day", () => {
    expect(formatDay(new Date("2026-11-18T09:18:00.000Z").toISOString(), NOW)).toBe("yesterday");
  });

  it("returns 'on <month> <day>' for an earlier day", () => {
    expect(formatDay(new Date("2026-11-12T09:18:00.000Z").toISOString(), NOW)).toBe("on Nov 12");
  });
});

describe("formatUpdatedDay", () => {
  it("returns 'Today' for the same calendar day", () => {
    expect(formatUpdatedDay(new Date("2026-11-19T09:18:00.000Z").toISOString(), NOW)).toBe("Today");
  });

  it("returns 'Yesterday' for the previous calendar day", () => {
    expect(formatUpdatedDay(new Date("2026-11-18T09:18:00.000Z").toISOString(), NOW)).toBe(
      "Yesterday",
    );
  });

  it("returns a short date like 'Nov 12' for an earlier day", () => {
    expect(formatUpdatedDay(new Date("2026-11-12T09:18:00.000Z").toISOString(), NOW)).toBe(
      "Nov 12",
    );
  });
});

describe("formatRelativeStart", () => {
  it("returns minutes ago for a very recent time", () => {
    expect(formatRelativeStart(new Date("2026-11-19T15:25:00.000Z").toISOString(), NOW)).toBe(
      "5 minutes ago",
    );
  });

  it("returns hours ago for an earlier time today", () => {
    expect(formatRelativeStart(new Date("2026-11-19T13:30:00.000Z").toISOString(), NOW)).toBe(
      "2 hours ago",
    );
  });

  it("returns 'today at <time>' for a time more than 6 hours before but same calendar day", () => {
    const result = formatRelativeStart(new Date("2026-11-19T00:05:00.000Z").toISOString(), NOW);
    expect(result).toMatch(/^today at /);
  });

  it("returns 'yesterday at <time>' for the previous calendar day", () => {
    const result = formatRelativeStart(new Date("2026-11-18T09:18:00.000Z").toISOString(), NOW);
    expect(result).toMatch(/^yesterday at /);
  });

  it("returns 'on <month> <day>' for an earlier day", () => {
    expect(formatRelativeStart(new Date("2026-11-12T09:18:00.000Z").toISOString(), NOW)).toBe(
      "on Nov 12",
    );
  });
});
