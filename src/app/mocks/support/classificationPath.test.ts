import { describe, expect, it } from "vitest";
import { classificationsStore } from "../fixtures/classifications.fixtures";
import type { StoredClassification } from "../fixtures/classifications.fixtures";
import { buildClassificationPath } from "./classificationPath";
import { serializeClassification } from "./serializeClassification";

function seedRecord(id: string): StoredClassification {
  const item = classificationsStore.find((candidate) => candidate.id === id);
  if (!item) throw new Error(`Missing seed ${id}`);
  return item;
}

describe("buildClassificationPath", () => {
  it("builds chapter, heading, subheading and national levels ending in the effective code", () => {
    const path = buildClassificationPath(seedRecord("cls_002"));

    expect(path?.map((level) => level.level)).toEqual([
      "chapter",
      "heading",
      "subheading",
      "national",
    ]);
    expect(path?.map((level) => level.code)).toEqual(["85", "8518", "8518.30", "8518.30.0000"]);
    expect(path?.[3].isSample).toBe(true);
    expect(path?.[0].isSample).toBeUndefined();
  });

  it("follows the overridden code, not the suggested one", () => {
    const path = buildClassificationPath(seedRecord("cls_001"));

    expect(path?.[3].code).toBe("6109.90.0000");
  });

  it("returns undefined when the chapter or heading is unknown", () => {
    const item = { ...seedRecord("cls_002"), suggestedCode: "9999.99.0000" };

    expect(buildClassificationPath(item)).toBeUndefined();
  });
});

describe("serializeClassification", () => {
  it("adds both expiresAt and path", () => {
    const result = serializeClassification(seedRecord("cls_002"));

    expect(result.expiresAt).toEqual(expect.any(String));
    expect(result.path).toHaveLength(4);
  });

  it("omits path when it cannot be built, instead of adding an undefined key", () => {
    const item = { ...seedRecord("cls_002"), suggestedCode: "9999.99.0000" };

    expect("path" in serializeClassification(item)).toBe(false);
  });
});
