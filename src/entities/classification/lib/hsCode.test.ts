import { describe, expect, it } from "vitest";
import { isValidHsCode } from "./hsCode";

describe("isValidHsCode", () => {
  it("accepts a 4.2 digit code", () => {
    expect(isValidHsCode("8518.30")).toBe(true);
  });

  it("accepts a 4.2.2 digit code", () => {
    expect(isValidHsCode("8518.30.40")).toBe(true);
  });

  it("rejects a code without a dot", () => {
    expect(isValidHsCode("851830")).toBe(false);
  });

  it("rejects free text", () => {
    expect(isValidHsCode("wireless earbuds")).toBe(false);
  });

  it("ignores surrounding whitespace", () => {
    expect(isValidHsCode("  8518.30  ")).toBe(true);
  });
});
