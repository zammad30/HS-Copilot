import { describe, expect, it } from "vitest";
import { safeReturnPath } from "./safeReturnPath";

describe("safeReturnPath - valid app routes", () => {
  it.each([
    "/app",
    "/app/classify/new",
    "/app/library",
    "/app/batches/new",
    "/app/settings/members",
    "/app/classifications/cls_008",
    "/app/batches/batch-42",
    "/pricing",
  ])("keeps %s", (path) => {
    expect(safeReturnPath(path)).toBe(path);
  });

  it("drops the query string and the hash", () => {
    expect(safeReturnPath("/app?x=1")).toBe("/app");
    expect(safeReturnPath("/app/library?status=pending#top")).toBe("/app/library");
    expect(safeReturnPath("/app#section")).toBe("/app");
  });
});

describe("safeReturnPath - hostile or invalid input falls back to /app", () => {
  it.each([
    ["an absolute URL", "https://evil.com"],
    ["an uppercase scheme", "HTTP://evil.com"],
    ["a protocol-relative URL", "//evil.com"],
    ["a slash-backslash host", "/\\evil.com"],
    ["a backslash anywhere", "/app\\..\\evil"],
    ["a script scheme", "javascript:alert(1)"],
    ["a leading space", " /app"],
    ["a trailing newline", "/app\n"],
    ["an encoded CRLF", "/app%0d%0a"],
    ["a raw CRLF", "/app\r\nSet-Cookie: x=1"],
    ["a tab", "/app\t/library"],
    ["an encoded slash host", "/%2Fevil.com"],
    ["an unknown path", "/not-a-route"],
    ["a dynamic route with a nested slash", "/app/classifications/a/b"],
    ["a path that only starts like a route", "/application"],
    ["an empty string", ""],
    ["a very long value", `/app/${"a".repeat(5000)}`],
  ])("%s", (_label, input) => {
    expect(safeReturnPath(input)).toBe("/app");
  });

  it("rejects auth screens and the dev kit, which are known routes but never a destination", () => {
    expect(safeReturnPath("/signin")).toBe("/app");
    expect(safeReturnPath("/signup")).toBe("/app");
    expect(safeReturnPath("/reset")).toBe("/app");
    expect(safeReturnPath("/_kit")).toBe("/app");
  });

  it.each([
    ["an array (repeated query param)", ["/app/library", "/app"]],
    ["a one-item array", ["/app/library"]],
    ["null", null],
    ["undefined", undefined],
    ["a number", 42],
    ["an object", { path: "/app" }],
  ])("%s", (_label, input) => {
    expect(safeReturnPath(input)).toBe("/app");
  });
});
