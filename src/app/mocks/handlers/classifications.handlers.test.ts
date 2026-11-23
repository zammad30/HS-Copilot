import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { http, ApiError } from "@/shared/api";
import type { Classification, ClassificationListResponse } from "@/entities/classification";
import { resetClassificationsStore } from "../fixtures/classifications.fixtures";
import { membersFixtures } from "../fixtures/members.fixtures";
import { resetPlanStore } from "../fixtures/plans.fixtures";
import { setMockNow, resetMockNow } from "../support/mockNow";

interface WorkspaceUsageResponse {
  usage: { classificationsUsed: number };
}

const SEED_BATCH_ID = "batch_seed_001";

// Exercises the real MSW handlers (registered globally in tests/setup.ts)
// through the real http client, with no mock of @/shared/api.
describe("classifications handlers", () => {
  beforeEach(() => {
    resetClassificationsStore();
  });
  afterEach(() => {
    resetPlanStore();
    resetMockNow();
  });

  it("GET /classifications filters by search text across description and code, case-insensitively", async () => {
    const byDescription = await http.get<{ items: Classification[]; total: number }>(
      "/classifications?search=BLUETOOTH",
    );
    expect(byDescription.total).toBe(1);
    expect(byDescription.items[0]?.id).toBe("cls_002");

    const byCode = await http.get<{ items: Classification[]; total: number }>(
      "/classifications?search=8518.30",
    );
    expect(byCode.total).toBe(1);
    expect(byCode.items[0]?.id).toBe("cls_002");
  });

  it("GET /classifications combines search and status filters", async () => {
    const result = await http.get<{ items: Classification[]; total: number }>(
      "/classifications?search=steel&status=approved",
    );
    expect(result.items.every((item) => item.status === "approved")).toBe(true);
    expect(result.items.every((item) => item.description.toLowerCase().includes("steel"))).toBe(
      true,
    );
  });

  it("GET /classifications paginates with page and pageSize, and total reflects the filtered count", async () => {
    const page1 = await http.get<{ items: Classification[]; total: number; page: number }>(
      "/classifications?page=1&pageSize=10",
    );
    expect(page1.items).toHaveLength(10);
    expect(page1.total).toBe(14);

    const page2 = await http.get<{ items: Classification[]; total: number }>(
      "/classifications?page=2&pageSize=10",
    );
    expect(page2.items).toHaveLength(4);
    expect(page2.total).toBe(14);
  });

  it("GET /classifications/:id returns the full record", async () => {
    const item = await http.get<Classification>("/classifications/cls_002");
    expect(item.id).toBe("cls_002");
    expect(item.candidates.length).toBeGreaterThan(0);
  });

  it("GET /classifications/:id on an unknown id returns a 404 ApiError", async () => {
    await expect(http.get("/classifications/does-not-exist")).rejects.toMatchObject({
      status: 404,
      code: "not_found",
    });
  });

  it("approve sets status to approved and appends a real-timestamp audit entry", async () => {
    const before = Date.now();
    const updated = await http.post<Classification>("/classifications/cls_002/decision", {
      action: "approve",
    });

    expect(updated.status).toBe("approved");
    expect(updated.finalCode).toBe(updated.suggestedCode);
    expect(updated.overridden).toBe(false);
    const lastEntry = updated.auditTrail[updated.auditTrail.length - 1];
    expect(lastEntry.action).toBe("approved");
    expect(new Date(lastEntry.at).getTime()).toBeGreaterThanOrEqual(before);
  });

  it("reject without a reason is rejected with a 422 validation error", async () => {
    await expect(
      http.post("/classifications/cls_002/decision", { action: "reject" }),
    ).rejects.toMatchObject({ status: 422, code: "validation_error" });
  });

  it("reject with a reason sets status to rejected and clears the final code", async () => {
    const updated = await http.post<Classification>("/classifications/cls_002/decision", {
      action: "reject",
      reason: "Does not match the suggested heading.",
    });

    expect(updated.status).toBe("rejected");
    expect(updated.finalCode).toBeUndefined();
    expect(updated.overridden).toBe(false);
    expect(updated.auditTrail[updated.auditTrail.length - 1].action).toBe("rejected");
  });

  it("approve with a code of the wrong length for the record's destination is rejected", async () => {
    // cls_002 is a US_HTS record, which needs 10 digits.
    await expect(
      http.post("/classifications/cls_002/decision", { action: "approve", code: "8518.30" }),
    ).rejects.toMatchObject({ status: 422, code: "validation_error" });
    const unchanged = await http.get<Classification>("/classifications/cls_002");
    expect(unchanged.status).toBe("needs_review");
  });

  it("approve with a code of the correct length sets it as the final code", async () => {
    const updated = await http.post<Classification>("/classifications/cls_002/decision", {
      action: "approve",
      code: "8518.22.0000",
    });
    expect(updated.status).toBe("approved");
    expect(updated.finalCode).toBe("8518.22.0000");
  });

  it("approve without a code still approves the suggested code", async () => {
    const updated = await http.post<Classification>("/classifications/cls_002/decision", {
      action: "approve",
    });
    expect(updated.status).toBe("approved");
    expect(updated.finalCode).toBe(updated.suggestedCode);
  });

  it("override without a valid code is rejected with a 422 validation error", async () => {
    await expect(
      http.post("/classifications/cls_002/decision", {
        action: "override",
        code: "not-a-code",
        reason: "Because",
      }),
    ).rejects.toMatchObject({ status: 422, code: "validation_error" });
  });

  it("override with a code of the wrong length for the record's destination is rejected", async () => {
    // cls_002 is a US_HTS record, which needs 10 digits.
    await expect(
      http.post("/classifications/cls_002/decision", {
        action: "override",
        code: "8518.22",
        reason: "Because",
      }),
    ).rejects.toMatchObject({ status: 422, code: "validation_error" });
    await expect(
      http.post("/classifications/cls_002/decision", {
        action: "override",
        code: "8518.22.000000",
        reason: "Because",
      }),
    ).rejects.toMatchObject({ status: 422, code: "validation_error" });
  });

  it("override with the current code is rejected", async () => {
    await expect(
      http.post("/classifications/cls_002/decision", {
        action: "override",
        code: "8518.30.0000",
        reason: "Because",
      }),
    ).rejects.toMatchObject({ status: 422, code: "validation_error" });
  });

  it("override without a reason is rejected with a 422 validation error", async () => {
    await expect(
      http.post("/classifications/cls_002/decision", { action: "override", code: "8518.22.0000" }),
    ).rejects.toMatchObject({ status: 422, code: "validation_error" });
  });

  it("override sets status to approved, overridden true, and the chosen final code", async () => {
    const updated = await http.post<Classification>("/classifications/cls_002/decision", {
      action: "override",
      code: "8518.22.0000",
      reason: "Better matches the product's principal use.",
    });

    expect(updated.status).toBe("approved");
    expect(updated.overridden).toBe(true);
    expect(updated.finalCode).toBe("8518.22.0000");
    expect(updated.auditTrail[updated.auditTrail.length - 1].action).toBe("overridden");
  });

  it("request_info without an assignee is rejected with a 422 validation error", async () => {
    await expect(
      http.post("/classifications/cls_002/decision", { action: "request_info" }),
    ).rejects.toMatchObject({ status: 422, code: "validation_error" });
  });

  it("request_info sets status to pending and records the assignee's name", async () => {
    const assignee = membersFixtures[1];
    const updated = await http.post<Classification>("/classifications/cls_002/decision", {
      action: "request_info",
      assigneeId: assignee.id,
    });

    expect(updated.status).toBe("pending");
    const lastEntry = updated.auditTrail[updated.auditTrail.length - 1];
    expect(lastEntry.action).toBe("info_requested");
    expect(lastEntry.detail).toContain(assignee.name);
  });

  it("undo restores the state from before the most recent decision", async () => {
    await http.post<Classification>("/classifications/cls_002/decision", { action: "approve" });
    const undone = await http.post<Classification>("/classifications/cls_002/decision", {
      action: "undo",
    });

    expect(undone.status).toBe("needs_review");
    expect(undone.auditTrail[undone.auditTrail.length - 1].action).toBe("undone");
  });

  it("undo with nothing to undo returns a 409 error", async () => {
    await expect(
      http.post("/classifications/cls_002/decision", { action: "undo" }),
    ).rejects.toMatchObject({ status: 409, code: "nothing_to_undo" });
  });

  it("a second undo in a row (no decision in between) returns a 409 error", async () => {
    await http.post<Classification>("/classifications/cls_002/decision", { action: "approve" });
    await http.post<Classification>("/classifications/cls_002/decision", { action: "undo" });

    await expect(
      http.post("/classifications/cls_002/decision", { action: "undo" }),
    ).rejects.toMatchObject({ status: 409, code: "nothing_to_undo" });
  });

  it("an unsupported action is rejected with a 422 validation error", async () => {
    try {
      await http.post("/classifications/cls_002/decision", { action: "delete" });
      throw new Error("expected the request to reject");
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
      expect((error as ApiError).status).toBe(422);
    }
  });

  it("decision on an unknown id returns a 404 ApiError", async () => {
    await expect(
      http.post("/classifications/does-not-exist/decision", { action: "approve" }),
    ).rejects.toMatchObject({ status: 404, code: "not_found" });
  });

  it("delete removes the record so a later GET no longer includes it", async () => {
    await http.delete("/classifications/cls_002");

    const list = await http.get<{ items: { id: string }[] }>("/classifications");
    expect(list.items.some((item) => item.id === "cls_002")).toBe(false);
  });

  it("delete on an unknown id returns a 404 ApiError", async () => {
    await expect(http.delete("/classifications/does-not-exist")).rejects.toMatchObject({
      status: 404,
      code: "not_found",
    });
  });

  it("every response shape that returns a Classification carries expiresAt", async () => {
    const list = await http.get<ClassificationListResponse>("/classifications");
    expect(typeof list.items[0]?.expiresAt).toBe("string");

    const detail = await http.get<Classification>("/classifications/cls_002");
    expect(typeof detail.expiresAt).toBe("string");

    const decided = await http.post<Classification>("/classifications/cls_002/decision", {
      action: "approve",
    });
    expect(typeof decided.expiresAt).toBe("string");

    const batchItems = await http.get<ClassificationListResponse>(
      `/batches/${SEED_BATCH_ID}/items`,
    );
    expect(typeof batchItems.items[0]?.expiresAt).toBe("string");
  });

  it("GET /classifications?expiring=true on Free (30-day retention, 10-day window) returns only the one record within 10 days of expiry", async () => {
    await http.put("/__mock/plan", { plan: "free" });

    // On Free, records older than 30 days are already expired and hidden;
    // cls_003 (25 days old) is the only one left inside the 10-day window.
    const all = await http.get<ClassificationListResponse>("/classifications");
    expect(all.total).toBe(5);

    const expiring = await http.get<ClassificationListResponse>("/classifications?expiring=true");
    expect(expiring.total).toBe(1);
    expect(expiring.items[0]?.id).toBe("cls_003");
  });

  it("GET /classifications?expiring=true on Team (730-day retention, 30-day window) catches a record once it nears expiry", async () => {
    // cls_012 is seeded 500 days old; advancing the mock clock 210 days
    // leaves it 20 days from its 730-day retention limit, inside the window.
    const now = Date.now();
    setMockNow(now + 210 * 24 * 60 * 60 * 1000);

    const expiring = await http.get<ClassificationListResponse>("/classifications?expiring=true");
    expect(expiring.items.map((item) => item.id)).toEqual(["cls_012"]);
  });

  it("an expired record is hidden from list/detail/decision/delete, and restored after switching the plan back", async () => {
    await http.put("/__mock/plan", { plan: "free" });

    await expect(http.get("/classifications/cls_012")).rejects.toMatchObject({
      status: 404,
      code: "not_found",
    });
    await expect(
      http.post("/classifications/cls_012/decision", { action: "approve" }),
    ).rejects.toMatchObject({ status: 404, code: "not_found" });
    await expect(http.delete("/classifications/cls_012")).rejects.toMatchObject({
      status: 404,
      code: "not_found",
    });
    const hiddenList = await http.get<ClassificationListResponse>("/classifications");
    expect(hiddenList.items.map((item) => item.id)).not.toContain("cls_012");

    await http.put("/__mock/plan", { plan: "team" });

    const restored = await http.get<Classification>("/classifications/cls_012");
    expect(restored.id).toBe("cls_012");
    const restoredList = await http.get<ClassificationListResponse>("/classifications");
    expect(restoredList.items.map((item) => item.id)).toContain("cls_012");
  });

  it("POST /classifications increases usage.classificationsUsed by exactly 1", async () => {
    const before = await http.get<WorkspaceUsageResponse>("/workspace");

    await http.post("/classifications", {
      description: "Blue widget",
      attributes: {},
      jurisdiction: "US_HTS",
    });

    const after = await http.get<WorkspaceUsageResponse>("/workspace");
    expect(after.usage.classificationsUsed).toBe(before.usage.classificationsUsed + 1);
  });

  it("POST /classifications is refused with plan_limit_reached once the plan's classification limit is used", async () => {
    await http.put("/__mock/plan", { plan: "free" });
    // Free's limit is 5; usage is seeded at 3, so two more creates reach it.
    await http.post("/classifications", {
      description: "First",
      attributes: {},
      jurisdiction: "US_HTS",
    });
    await http.post("/classifications", {
      description: "Second",
      attributes: {},
      jurisdiction: "US_HTS",
    });

    await expect(
      http.post("/classifications", {
        description: "Third",
        attributes: {},
        jurisdiction: "US_HTS",
      }),
    ).rejects.toMatchObject({
      status: 403,
      code: "plan_limit_reached",
      details: { reason: "classifications", limit: 5, used: 5 },
    });
  });
});

describe("classifications handlers - path on full records", () => {
  beforeEach(() => {
    resetClassificationsStore();
  });

  it("GET /classifications/:id returns a path whose last level is the effective code", async () => {
    const item = await http.get<Classification>("/classifications/cls_002");

    expect(item.path?.map((level) => level.level)).toEqual([
      "chapter",
      "heading",
      "subheading",
      "national",
    ]);
    expect(item.path?.[3].code).toBe("8518.30.0000");
  });

  it("every decision response carries a path that matches the new effective code", async () => {
    const overridden = await http.post<Classification>("/classifications/cls_013/decision", {
      action: "override",
      code: "4202.32.0000",
      reason: "Better matches the principal use.",
    });
    expect(overridden.path?.[3].code).toBe("4202.32.0000");
    expect(overridden.path?.[1].code).toBe("4202");

    const undone = await http.post<Classification>("/classifications/cls_013/decision", {
      action: "undo",
    });
    expect(undone.path?.[3].code).toBe("3926.90.0000");

    const approved = await http.post<Classification>("/classifications/cls_013/decision", {
      action: "approve",
    });
    expect(approved.path?.[3].code).toBe("3926.90.0000");

    const rejected = await http.post<Classification>("/classifications/cls_013/decision", {
      action: "reject",
      reason: "Does not match.",
    });
    expect(rejected.path?.[3].code).toBe("3926.90.0000");

    const infoRequested = await http.post<Classification>("/classifications/cls_013/decision", {
      action: "request_info",
      assigneeId: membersFixtures[0].id,
    });
    expect(infoRequested.path?.[3].code).toBe("3926.90.0000");
  });
});
