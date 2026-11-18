import { beforeEach, describe, expect, it } from "vitest";
import { http } from "@/shared/api";
import { resetClassificationsStore } from "../fixtures/classifications.fixtures";

// Exercises the real MSW handlers (registered globally in tests/setup.ts)
// through the real http client, with no mock of @/shared/api.
describe("classifications handlers", () => {
  beforeEach(() => {
    resetClassificationsStore();
  });

  it("approve sets status to approved and appends a real-timestamp audit entry", async () => {
    const before = Date.now();
    const updated = await http.post<{
      status: string;
      auditTrail: { action: string; at: string }[];
    }>("/classifications/cls_002/decision", { action: "approve" });

    expect(updated.status).toBe("approved");
    const lastEntry = updated.auditTrail[updated.auditTrail.length - 1];
    expect(lastEntry.action).toBe("approved");
    expect(new Date(lastEntry.at).getTime()).toBeGreaterThanOrEqual(before);
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
