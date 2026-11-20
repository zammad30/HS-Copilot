import { describe, expect, it } from "vitest";
import {
  classificationListResponseSchema,
  classificationSchema,
  decisionActionSchema,
  statusSchema,
} from "./classification.schema";

const VALID_CLASSIFICATION = {
  id: "cls_1",
  workspaceId: "workspace_1",
  description: "Men's 100% cotton knitted crew-neck T-shirt",
  attributes: { intendedUse: "Apparel" },
  jurisdiction: "US_HTS",
  suggestedCode: "6109.10",
  overridden: false,
  confidence: 96,
  status: "approved",
  candidates: [
    {
      code: "6109.10",
      title: "Knitted cotton apparel",
      confidence: 96,
      reasoning: [{ title: "Product description", body: "Establishes the product as apparel." }],
    },
  ],
  evidence: [
    {
      kind: "tariff_text",
      title: "HTS heading 6109",
      reference: "HTS heading 6109",
      excerpt: "Described by material, construction, and principal function.",
    },
  ],
  auditTrail: [
    {
      id: "cls_1_audit_1",
      at: "2026-11-01T00:00:00.000Z",
      actor: "AI agent",
      action: "created",
      detail: "Created.",
    },
  ],
  createdAt: "2026-11-01T00:00:00.000Z",
  updatedAt: "2026-11-01T00:00:00.000Z",
  createdBy: "reviewer@hs-copilot.test",
  expiresAt: "2027-11-01T00:00:00.000Z",
};

describe("classificationSchema", () => {
  it("parses a full, valid classification", () => {
    expect(() => classificationSchema.parse(VALID_CLASSIFICATION)).not.toThrow();
  });

  it("accepts an overridden classification with a finalCode", () => {
    const result = classificationSchema.parse({
      ...VALID_CLASSIFICATION,
      overridden: true,
      finalCode: "7323.93",
    });
    expect(result.overridden).toBe(true);
    expect(result.finalCode).toBe("7323.93");
  });

  it("rejects an unknown status", () => {
    expect(() =>
      classificationSchema.parse({ ...VALID_CLASSIFICATION, status: "archived" }),
    ).toThrow();
  });

  it("rejects a missing required field", () => {
    const withoutCode: Record<string, unknown> = { ...VALID_CLASSIFICATION };
    delete withoutCode.suggestedCode;
    expect(() => classificationSchema.parse(withoutCode)).toThrow();
  });

  it("rejects a classification with no expiresAt", () => {
    const withoutExpiresAt: Record<string, unknown> = { ...VALID_CLASSIFICATION };
    delete withoutExpiresAt.expiresAt;
    expect(() => classificationSchema.parse(withoutExpiresAt)).toThrow();
  });

  it("parses without a model field", () => {
    const result = classificationSchema.parse(VALID_CLASSIFICATION);
    expect(result.model).toBeUndefined();
  });

  it("accepts an optional model field with isSample", () => {
    const result = classificationSchema.parse({
      ...VALID_CLASSIFICATION,
      model: { version: "hts-classifier-v3", isSample: true },
    });
    expect(result.model).toEqual({ version: "hts-classifier-v3", isSample: true });
  });
});

describe("statusSchema", () => {
  it("accepts every contract status", () => {
    for (const status of ["approved", "rejected", "needs_review", "pending"]) {
      expect(() => statusSchema.parse(status)).not.toThrow();
    }
  });
});

describe("decisionActionSchema", () => {
  it("accepts every contract decision action", () => {
    for (const action of ["approve", "reject", "override", "request_info", "undo"]) {
      expect(() => decisionActionSchema.parse(action)).not.toThrow();
    }
  });
});

describe("classificationListResponseSchema", () => {
  it("parses a paginated list envelope", () => {
    const result = classificationListResponseSchema.parse({
      items: [VALID_CLASSIFICATION],
      total: 1,
      page: 1,
      pageSize: 50,
    });
    expect(result.items).toHaveLength(1);
  });
});
