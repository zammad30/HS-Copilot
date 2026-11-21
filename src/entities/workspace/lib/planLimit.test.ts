import { describe, expect, it } from "vitest";
import { ApiError } from "@/shared/api";
import { parsePlanLimitError, planLimitMessage } from "./planLimit";

const NOW = new Date("2026-11-22T12:00:00");

function limitError(details: unknown, code = "plan_limit_reached") {
  return new ApiError("This plan has reached its limit.", { code, status: 403, details });
}

describe("parsePlanLimitError", () => {
  it("returns the details for a plan_limit_reached ApiError", () => {
    const details = { reason: "classifications", limit: 5, used: 5 };
    expect(parsePlanLimitError(limitError(details))).toEqual(details);
  });

  it("returns null for a different error code", () => {
    expect(
      parsePlanLimitError(limitError({ reason: "seats", limit: 1, used: 1 }, "forbidden")),
    ).toBeNull();
  });

  it("returns null when the details are missing or invalid", () => {
    expect(parsePlanLimitError(limitError(undefined))).toBeNull();
    expect(parsePlanLimitError(limitError({ reason: "nope", limit: 5, used: 5 }))).toBeNull();
    expect(parsePlanLimitError(limitError({ reason: "seats", limit: "1", used: 1 }))).toBeNull();
  });

  it("returns null for anything that is not an ApiError", () => {
    expect(parsePlanLimitError(new Error("boom"))).toBeNull();
    expect(parsePlanLimitError({ code: "plan_limit_reached" })).toBeNull();
    expect(parsePlanLimitError(null)).toBeNull();
    expect(parsePlanLimitError(undefined)).toBeNull();
  });
});

describe("planLimitMessage", () => {
  it("explains a used-up lifetime classification limit with no reset date", () => {
    expect(
      planLimitMessage(
        { reason: "classifications", limit: 5, used: 5 },
        { period: "lifetime", periodEnd: "2026-11-30T12:00:00", now: NOW },
      ),
    ).toBe("You have used all 5 classifications in your plan.");
  });

  it("adds the reset date for a monthly limit, with a single 'on'", () => {
    const text = planLimitMessage(
      { reason: "classifications", limit: 1300, used: 1300 },
      { period: "month", periodEnd: "2026-11-30T12:00:00", now: NOW },
    );
    expect(text).toBe(
      "You have used all 1,300 classifications in your plan. Your limit resets on Nov 30.",
    );
    expect(text).not.toMatch(/on on/i);
  });

  it("says the limit resets today on the last day of the period", () => {
    expect(
      planLimitMessage(
        { reason: "classifications", limit: 500, used: 500 },
        { period: "month", periodEnd: "2026-11-22T20:00:00", now: NOW },
      ),
    ).toBe("You have used all 500 classifications in your plan. Your limit resets today.");
  });

  it("leaves out the reset sentence for a monthly plan without a periodEnd", () => {
    expect(
      planLimitMessage({ reason: "classifications", limit: 500, used: 500 }, { period: "month" }),
    ).toBe("You have used all 500 classifications in your plan.");
  });

  it("covers the other reasons", () => {
    expect(planLimitMessage({ reason: "batch_uploads", limit: 3, used: 3 })).toBe(
      "You have used all 3 batch uploads for this month.",
    );
    expect(planLimitMessage({ reason: "batch_rows", limit: 50, used: 80 })).toBe(
      "Your plan allows up to 50 rows per batch upload.",
    );
    expect(planLimitMessage({ reason: "seats", limit: 5, used: 5 })).toBe(
      "Your plan allows 5 people.",
    );
    expect(planLimitMessage({ reason: "feature", limit: 0, used: 0 })).toBe(
      "This is not included in your plan.",
    );
  });
});
