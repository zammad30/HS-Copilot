import { afterEach, describe, expect, it } from "vitest";
import { http, ApiError } from "@/shared/api";
import {
  DESTINATIONS,
  importCodeLength,
  isValidHsCode,
  type Classification,
} from "@/entities/classification";
import { resetClassificationsStore } from "../fixtures/classifications.fixtures";

afterEach(() => resetClassificationsStore());

describe("POST /classifications - destination", () => {
  it.each(DESTINATIONS.map((entry) => [entry.id, entry.label] as const))(
    "produces sample codes of the %s (%s) import length with the real HS prefix",
    async (jurisdiction) => {
      const created = await http.post<{ classificationId: string }>("/classifications", {
        description: "Wireless Bluetooth earbuds with charging case",
        attributes: { intendedUse: "Personal audio, bluetooth" },
        jurisdiction,
      });
      const record = await http.get<Classification>(`/classifications/${created.classificationId}`);

      expect(record.jurisdiction).toBe(jurisdiction);
      const codes = [record.suggestedCode, ...record.candidates.map((candidate) => candidate.code)];
      for (const code of codes) {
        expect(code.replace(/\D/g, "")).toHaveLength(importCodeLength(jurisdiction));
        expect(isValidHsCode(code, jurisdiction)).toBe(true);
      }
      expect(record.suggestedCode.startsWith("8517.62")).toBe(true);
      expect(record.model?.isSample).toBe(true);
      expect(record.evidence.filter((item) => item.kind === "ruling")[0]?.isSample).toBe(true);
    },
  );

  it("rejects a destination that is not one of the six", async () => {
    await expect(
      http.post("/classifications", {
        description: "Cotton T-shirt",
        attributes: {},
        jurisdiction: "JP_HS",
      }),
    ).rejects.toBeInstanceOf(ApiError);
  });
});
