import { describe, expect, it } from "vitest";
import type { Jurisdiction } from "../model/classification.schema";
import { isValidHsCode } from "./hsCode";

const TEN_DIGIT: Jurisdiction[] = ["US_HTS", "EU_CN", "UK_UKGT", "CA_CCT", "AU_WT"];

describe("isValidHsCode", () => {
  it.each(TEN_DIGIT)("accepts a 10 digit code for %s", (jurisdiction) => {
    expect(isValidHsCode("8518.30.0000", jurisdiction)).toBe(true);
  });

  it.each(TEN_DIGIT)("rejects 6, 9, 11 and 12 digit codes for %s", (jurisdiction) => {
    expect(isValidHsCode("8518.30", jurisdiction)).toBe(false);
    expect(isValidHsCode("8518.30.000", jurisdiction)).toBe(false);
    expect(isValidHsCode("8518.30.00000", jurisdiction)).toBe(false);
    expect(isValidHsCode("8518.30.000000", jurisdiction)).toBe(false);
  });

  it("accepts the 8 digit CN level for the EU only", () => {
    expect(isValidHsCode("8518.30.00", "EU_CN")).toBe(true);
    expect(isValidHsCode("8518.30.00", "UK_UKGT")).toBe(false);
    expect(isValidHsCode("8518.30.00", "US_HTS")).toBe(false);
  });

  it("requires 12 digits for Turkey", () => {
    expect(isValidHsCode("8518.30.000000", "TR_GTIP")).toBe(true);
    expect(isValidHsCode("8518.30.0000", "TR_GTIP")).toBe(false);
  });

  it("ignores separators when counting digits", () => {
    expect(isValidHsCode("8518300000", "US_HTS")).toBe(true);
    expect(isValidHsCode("8518 30 0000", "US_HTS")).toBe(true);
    expect(isValidHsCode("8518-30-0000", "US_HTS")).toBe(true);
  });

  it("rejects free text and letters mixed with digits", () => {
    expect(isValidHsCode("wireless earbuds", "US_HTS")).toBe(false);
    expect(isValidHsCode("8518.30.00AB", "US_HTS")).toBe(false);
    expect(isValidHsCode("", "US_HTS")).toBe(false);
  });

  it("ignores surrounding whitespace", () => {
    expect(isValidHsCode("  8518.30.0000  ", "US_HTS")).toBe(true);
  });
});
