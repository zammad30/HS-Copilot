import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createExpiringSessionText } from "./expiringSessionText";

const KEY = "test:expiring-text";
const TTL = 1000;
const MAX = 20;

describe("createExpiringSessionText", () => {
  beforeEach(() => window.sessionStorage.clear());
  afterEach(() => vi.restoreAllMocks());

  it("saves, reads and clears", () => {
    const draft = createExpiringSessionText(KEY, TTL);

    draft.save("frozen shrimp", MAX, 100);
    expect(draft.read(MAX, 200)).toBe("frozen shrimp");
    // Reading does not consume it, so a double read (StrictMode) still works.
    expect(draft.read(MAX, 200)).toBe("frozen shrimp");

    draft.clear();
    expect(draft.read(MAX, 200)).toBeUndefined();
    expect(window.sessionStorage.getItem(KEY)).toBeNull();
  });

  it("caps the text at the given maximum on save and on read", () => {
    const draft = createExpiringSessionText(KEY, TTL);

    draft.save("x".repeat(50), MAX, 100);
    expect(draft.read(MAX, 100)).toBe("x".repeat(MAX));
    expect(draft.read(5, 100)).toBe("xxxxx");
  });

  it("does not store blank text", () => {
    const draft = createExpiringSessionText(KEY, TTL);

    draft.save("   ", MAX, 100);
    expect(window.sessionStorage.getItem(KEY)).toBeNull();
  });

  it("ignores and clears a value older than the lifetime, using the passed-in time", () => {
    const draft = createExpiringSessionText(KEY, TTL);
    draft.save("old text", MAX, 0);

    expect(draft.read(MAX, TTL)).toBe("old text");
    expect(draft.read(MAX, TTL + 1)).toBeUndefined();
    expect(window.sessionStorage.getItem(KEY)).toBeNull();
  });

  it("ignores and clears a value stamped in the future", () => {
    const draft = createExpiringSessionText(KEY, TTL);
    draft.save("odd text", MAX, 5000);

    expect(draft.read(MAX, 100)).toBeUndefined();
    expect(window.sessionStorage.getItem(KEY)).toBeNull();
  });

  it.each([
    ["not JSON", "{oops"],
    ["a JSON string", JSON.stringify("text")],
    ["null", "null"],
    ["a record with the wrong shape", JSON.stringify({ text: 5, savedAt: "now" })],
    ["a record with an empty text", JSON.stringify({ text: "  ", savedAt: 1 })],
  ])("ignores and clears a corrupt value: %s", (_label, raw) => {
    const draft = createExpiringSessionText(KEY, TTL);
    window.sessionStorage.setItem(KEY, raw);

    expect(draft.read(MAX, 10)).toBeUndefined();
    expect(window.sessionStorage.getItem(KEY)).toBeNull();
  });

  it("does not throw when reading, writing or removing throws", () => {
    const draft = createExpiringSessionText(KEY, TTL);
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("blocked");
    });

    expect(() => draft.save("text", MAX)).not.toThrow();
    expect(draft.read(MAX)).toBeUndefined();
    expect(() => draft.clear()).not.toThrow();
  });

  it("does not throw when sessionStorage itself is inaccessible", () => {
    const draft = createExpiringSessionText(KEY, TTL);
    vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => {
      throw new Error("SecurityError");
    });

    expect(() => draft.save("text", MAX)).not.toThrow();
    expect(draft.read(MAX)).toBeUndefined();
    expect(() => draft.clear()).not.toThrow();
  });
});
