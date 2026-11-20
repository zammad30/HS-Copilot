import { beforeEach, describe, expect, it } from "vitest";
import { ApiError, http } from "@/shared/api";
import type { Batch } from "@/entities/batch";
import type { Classification, ClassificationListResponse } from "@/entities/classification";
import { resetBatchesStore } from "../fixtures/batch.fixtures";
import { resetClassificationsStore } from "../fixtures/classifications.fixtures";

const SEED_BATCH_ID = "batch_seed_001";

function buildUploadForm(csv: string, jurisdiction = "US_HTS"): FormData {
  const form = new FormData();
  form.set("file", new File([csv], "products.csv", { type: "text/csv" }));
  form.set("mapping", JSON.stringify({ description: "description" }));
  form.set("jurisdiction", jurisdiction);
  return form;
}

describe("batches handlers", () => {
  beforeEach(() => {
    resetBatchesStore();
    resetClassificationsStore();
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
});
