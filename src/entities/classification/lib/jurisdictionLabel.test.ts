import { describe, expect, it } from "vitest";
import { jurisdictionLabel } from "./jurisdictionLabel";

describe("jurisdictionLabel", () => {
  it("maps US_HTS to United States", () => {
    expect(jurisdictionLabel("US_HTS")).toBe("United States");
  });

  it("maps EU_CN to European Union", () => {
    expect(jurisdictionLabel("EU_CN")).toBe("European Union");
  });

  it("maps UK_UKGT to United Kingdom", () => {
    expect(jurisdictionLabel("UK_UKGT")).toBe("United Kingdom");
  });

  it("maps CA_CCT to Canada", () => {
    expect(jurisdictionLabel("CA_CCT")).toBe("Canada");
  });

  it("maps AU_WT to Australia", () => {
    expect(jurisdictionLabel("AU_WT")).toBe("Australia");
  });

  it("maps TR_GTIP to Turkey", () => {
    expect(jurisdictionLabel("TR_GTIP")).toBe("Turkey");
  });
});
