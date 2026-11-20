import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { ApiError, http } from "@/shared/api";
import type { Batch } from "@/entities/batch";
import type { Classification, ClassificationListResponse } from "@/entities/classification";
import { resetBatchesStore } from "../fixtures/batch.fixtures";
import { resetClassificationsStore } from "../fixtures/classifications.fixtures";
import { resetPlanStore, resetUsageStore } from "../fixtures/plans.fixtures";

const SEED_BATCH_ID = "batch_seed_001";

interface WorkspaceUsageResponse {
  usage: { classificationsUsed: number; batchUploadsUsed: number };
}

function buildUploadForm(csv: string, jurisdiction = "US_HTS"): FormData {
  const form = new FormData();
  form.set("file", new File([csv], "products.csv", { type: "text/csv" }));
  form.set("mapping", JSON.stringify({ description: "description" }));
  form.set("jurisdiction", jurisdiction);
  return form;
}

function csvWithRows(rowCount: number): string {
  const rows = Array.from({ length: rowCount }, (_, index) => `Widget ${index + 1}`);
  return `description\n${rows.join("\n")}`;
}

describe("batches handlers", () => {
  beforeEach(() => {
    resetBatchesStore();
    resetClassificationsStore();
  });
  afterEach(() => {
    resetPlanStore();
    resetUsageStore();
  });

  it("GET /batches/:id returns the seeded batch", async () => {
    const batch = await http.get<Batch>(`/batches/${SEED_BATCH_ID}`);
    expect(batch.id).toBe(SEED_BATCH_ID);
    expect(batch.filename).toBe("june_apparel_import.csv");
  });

  it("GET /batches/:id 404s for an unknown id", async () => {
    await expect(http.get("/batches/does-not-exist")).rejects.toMatchObject({
      code: "not_found",
    });
  });

  it("GET /batches/:id advances classified toward total on each poll, then completes", async () => {
    let batch = await http.get<Batch>(`/batches/${SEED_BATCH_ID}`);
    const first = batch.classified;

    for (let i = 0; i < 10 && batch.status !== "complete"; i += 1) {
      batch = await http.get<Batch>(`/batches/${SEED_BATCH_ID}`);
    }

    expect(batch.classified).toBeGreaterThanOrEqual(first);
    expect(batch.status).toBe("complete");
    expect(batch.classified).toBe(batch.total);
  });

  it("GET /batches/:id/items returns only this batch's classifications", async () => {
    const result = await http.get<ClassificationListResponse>(`/batches/${SEED_BATCH_ID}/items`);
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.total).toBe(result.items.length);
  });

  it("POST /batches/:id/pause and /resume flip status", async () => {
    const paused = await http.post<Batch>(`/batches/${SEED_BATCH_ID}/pause`);
    expect(paused.status).toBe("paused");

    const resumed = await http.post<Batch>(`/batches/${SEED_BATCH_ID}/resume`);
    expect(resumed.status).toBe("processing");
  });

  it("POST /batches/:id/bulk-approve approves items at or above the threshold", async () => {
    const items = await http.get<ClassificationListResponse>(`/batches/${SEED_BATCH_ID}/items`);
    const eligible = items.items.filter(
      (item: Classification) => item.confidence >= 80 && item.status !== "approved",
    );

    const result = await http.post<{ approvedCount: number }>(
      `/batches/${SEED_BATCH_ID}/bulk-approve`,
      { minConfidence: 80 },
    );
    expect(result.approvedCount).toBe(eligible.length);

    const afterwards = await http.get<ClassificationListResponse>(
      `/batches/${SEED_BATCH_ID}/items`,
    );
    for (const item of afterwards.items) {
      if (item.confidence >= 80) expect(item.status).toBe("approved");
    }
  });

  it("POST /batches creates a batch with one pending classification per non-empty row", async () => {
    const csv = "description,sku\nBlue widget,W-1\n,W-2\nRed widget,W-3";
    const created = await http.post<Batch>("/batches", buildUploadForm(csv));
    expect(created.total).toBe(2);
    expect(created.status).toBe("processing");

    const result = await http.get<ClassificationListResponse>(`/batches/${created.id}/items`);
    expect(result.items.map((item) => item.description).sort()).toEqual([
      "Blue widget",
      "Red widget",
    ]);
    expect(result.items.every((item) => item.status === "pending")).toBe(true);
  });

  it("POST /batches rejects a non-CSV-parseable file", async () => {
    const form = buildUploadForm('description\n"unterminated');
    await expect(http.post("/batches", form)).rejects.toThrow(ApiError);
  });

  it("POST /batches rejects a file over 5 MB", async () => {
    const bigContent = `description\n${"x".repeat(6 * 1024 * 1024)}`;
    const form = buildUploadForm(bigContent);
    await expect(http.post("/batches", form)).rejects.toThrow(ApiError);
  });

  it("POST /batches on Free is refused with plan_limit_reached reason 'feature' (no batch access at all)", async () => {
    await http.put("/__mock/plan", { plan: "free" });
    const form = buildUploadForm(csvWithRows(2));

    await expect(http.post("/batches", form)).rejects.toMatchObject({
      status: 403,
      code: "plan_limit_reached",
      details: { reason: "feature" },
    });
  });

  it("POST /batches on Solo with 51 rows is refused with reason 'batch_rows' (limit is 50)", async () => {
    await http.put("/__mock/plan", { plan: "solo" });
    const form = buildUploadForm(csvWithRows(51));

    await expect(http.post("/batches", form)).rejects.toMatchObject({
      status: 403,
      code: "plan_limit_reached",
      details: { reason: "batch_rows", limit: 50 },
    });
  });

  it("POST /batches is refused with reason 'batch_uploads' once this period's uploads are used up", async () => {
    await http.put("/__mock/plan", { plan: "solo" });
    // Solo allows 3 uploads/month; three small uploads use it up.
    for (let i = 0; i < 3; i += 1) {
      await http.post("/batches", buildUploadForm(csvWithRows(2)));
    }

    await expect(http.post("/batches", buildUploadForm(csvWithRows(2)))).rejects.toMatchObject({
      status: 403,
      code: "plan_limit_reached",
      details: { reason: "batch_uploads", limit: 3, used: 3 },
    });
  });

  it("POST /batches is refused with reason 'classifications' when rows exceed the remaining classification quota", async () => {
    await http.put("/__mock/plan", { plan: "solo" });
    // Solo allows 50 rows/upload and 3 uploads/month, with usage seeded at 3
    // of a 100 classification limit. Two 48-row uploads (uploadsUsed -> 2,
    // under the 3/month cap; well under 50 rows each) raise usage to
    // 3 + 96 = 99, leaving only 1 classification of quota.
    for (let i = 0; i < 2; i += 1) {
      await http.post("/batches", buildUploadForm(csvWithRows(48)));
    }
    const usage = await http.get<WorkspaceUsageResponse>("/workspace");
    expect(usage.usage.classificationsUsed).toBe(99);

    // A 2-row upload stays under maxRows and under the 3/month upload cap,
    // but its rows exceed the single classification of quota left.
    await expect(http.post("/batches", buildUploadForm(csvWithRows(2)))).rejects.toMatchObject({
      status: 403,
      code: "plan_limit_reached",
      details: { reason: "classifications", limit: 100, used: 99 },
    });
  });

  it("a successful upload increases both batchUploadsUsed (by 1) and classificationsUsed (by the row count)", async () => {
    const before = await http.get<WorkspaceUsageResponse>("/workspace");

    await http.post("/batches", buildUploadForm(csvWithRows(4)));

    const after = await http.get<WorkspaceUsageResponse>("/workspace");
    expect(after.usage.batchUploadsUsed).toBe(before.usage.batchUploadsUsed + 1);
    expect(after.usage.classificationsUsed).toBe(before.usage.classificationsUsed + 4);
  });

  it("a refused upload changes neither batchUploadsUsed nor classificationsUsed", async () => {
    await http.put("/__mock/plan", { plan: "free" });
    const before = await http.get<WorkspaceUsageResponse>("/workspace");

    await expect(http.post("/batches", buildUploadForm(csvWithRows(2)))).rejects.toThrow(ApiError);

    const after = await http.get<WorkspaceUsageResponse>("/workspace");
    expect(after.usage).toEqual(before.usage);
  });
});
