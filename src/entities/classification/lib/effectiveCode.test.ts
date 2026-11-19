import { describe, expect, it } from "vitest";
import { effectiveCode } from "./effectiveCode";

describe("effectiveCode", () => {
  it("returns the suggested code when there is no final code", () => {
    expect(effectiveCode({ suggestedCode: "8518.30" })).toBe("8518.30");
  });

  it("prefers the final code when set", () => {
    expect(effectiveCode({ suggestedCode: "8518.30", finalCode: "8518.22" })).toBe("8518.22");
  });
});
