import { describe, expect, it } from "vitest";
import { parsePageParam, parseStatusParam, serializeStatusParam } from "./libraryParams";

describe("parseStatusParam", () => {
  it("returns an empty array for null or empty input", () => {
    expect(parseStatusParam(null)).toEqual([]);
    expect(parseStatusParam("")).toEqual([]);
  });

  it("parses comma-separated known status values", () => {
    expect(parseStatusParam("needs_review,pending")).toEqual(["needs_review", "pending"]);
  });

  it("silently drops unknown status values", () => {
    expect(parseStatusParam("needs_review,bogus,approved")).toEqual(["needs_review", "approved"]);
  });
});

describe("serializeStatusParam", () => {
  it("joins statuses with commas", () => {
    expect(serializeStatusParam(["needs_review", "pending"])).toBe("needs_review,pending");
  });

  it("returns null for an empty list", () => {
    expect(serializeStatusParam([])).toBeNull();
  });
});

describe("parsePageParam", () => {
  it("defaults to 1 for missing, non-numeric, zero or negative input", () => {
    expect(parsePageParam(null)).toBe(1);
    expect(parsePageParam("abc")).toBe(1);
    expect(parsePageParam("0")).toBe(1);
    expect(parsePageParam("-3")).toBe(1);
  });

  it("parses a valid positive integer", () => {
    expect(parsePageParam("3")).toBe(3);
  });

  it("rejects non-integer values", () => {
    expect(parsePageParam("1.5")).toBe(1);
  });
});
