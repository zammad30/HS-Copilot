import { describe, expect, it } from "vitest";
import { jurisdictionSchema } from "./classification.schema";
import { DESTINATIONS, getDestination, importCodeLength } from "./destinations";

describe("DESTINATIONS", () => {
  it("lists the six destinations in UI order", () => {
    expect(DESTINATIONS.map((entry) => entry.label)).toEqual([
      "United States",
      "European Union",
      "United Kingdom",
      "Canada",
      "Australia",
      "Turkey",
    ]);
  });

  it("covers exactly the jurisdiction schema values", () => {
    expect(DESTINATIONS.map((entry) => entry.id).sort()).toEqual(
      [...jurisdictionSchema.options].sort(),
    );
  });

  it("uses 10 digits for the import code, except Turkey with 12", () => {
    expect(DESTINATIONS.map((entry) => importCodeLength(entry.id))).toEqual([
      10, 10, 10, 10, 10, 12,
    ]);
  });

  it("also allows the 8 digit CN level for the EU", () => {
    expect(getDestination("EU_CN").allowedLengths).toEqual([10, 8]);
  });
});
