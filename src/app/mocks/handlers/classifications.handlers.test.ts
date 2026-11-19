import { beforeEach, describe, expect, it } from "vitest";
import { http, ApiError } from "@/shared/api";
import type { Classification } from "@/entities/classification";
import { resetClassificationsStore } from "../fixtures/classifications.fixtures";
import { membersFixtures } from "../fixtures/members.fixtures";

// Exercises the real MSW handlers (registered globally in tests/setup.ts)
// through the real http client, with no mock of @/shared/api.
describe("classifications handlers", () => {
  beforeEach(() => {
    resetClassificationsStore();
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

  it("override without a valid code is rejected with a 422 validation error", async () => {
    await expect(
      http.post("/classifications/cls_002/decision", {
        action: "override",
        code: "not-a-code",
        reason: "Because",
      }),
    ).rejects.toMatchObject({ status: 422, code: "validation_error" });
  });

  it("override with the current code is rejected", async () => {
    await expect(
      http.post("/classifications/cls_002/decision", {
        action: "override",
        code: "8518.30",
        reason: "Because",
      }),
    ).rejects.toMatchObject({ status: 422, code: "validation_error" });
  });

  it("override without a reason is rejected with a 422 validation error", async () => {
    await expect(
      http.post("/classifications/cls_002/decision", { action: "override", code: "8518.22" }),
    ).rejects.toMatchObject({ status: 422, code: "validation_error" });
  });

  it("override sets status to approved, overridden true, and the chosen final code", async () => {
    const updated = await http.post<Classification>("/classifications/cls_002/decision", {
      action: "override",
      code: "8518.22",
      reason: "Better matches the product's principal use.",
    });

    expect(updated.status).toBe("approved");
    expect(updated.overridden).toBe(true);
    expect(updated.finalCode).toBe("8518.22");
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
});
