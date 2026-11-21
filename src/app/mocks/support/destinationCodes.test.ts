import { describe, expect, it } from "vitest";
import { DESTINATIONS, importCodeLength, isValidHsCode } from "@/entities/classification";
import { sampleCodeFor } from "./destinationCodes";

describe("sampleCodeFor", () => {
  it("keeps the real first 6 digits and pads placeholder national digits", () => {
    expect(sampleCodeFor("8518.30", "US_HTS")).toBe("8518.30.0000");
    expect(sampleCodeFor("8518.30", "TR_GTIP")).toBe("8518.30.000000");
  });

  it.each(DESTINATIONS.map((entry) => entry.id))(
    "produces a code of the right length that validates for %s",
    (jurisdiction) => {
      const code = sampleCodeFor("6109.10", jurisdiction);
      expect(code.replace(/\D/g, "")).toHaveLength(importCodeLength(jurisdiction));
      expect(isValidHsCode(code, jurisdiction)).toBe(true);
      expect(code.startsWith("6109.10")).toBe(true);
    },
  );
});
