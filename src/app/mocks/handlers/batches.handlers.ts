import { http, HttpResponse } from "msw";
import { env } from "@/shared/config";
import { jurisdictionSchema } from "@/entities/classification";
import { parseCsv } from "@/shared/lib/parseCsv";
import { applyForceDelay, forcedErrorResponse, randomLatency } from "../scenarios";
import {
  advanceBatch,
  batchClassifications,
  createBatch,
  findBatch,
  toPublicBatch,
} from "../fixtures/batch.fixtures";
import { applyClassificationListParams } from "../support/classificationQuery";
import { applyApproveTransition } from "../support/decisionTransitions";
import { isExpired, withExpiresAt } from "../support/classificationExpiry";
import { currentPlanLimits, usageStore } from "../fixtures/plans.fixtures";
import { planLimitReachedResponse } from "../support/planLimitError";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

function notFound(): Response {
  return HttpResponse.json(
    { error: { code: "not_found", message: "Batch not found" } },
    { status: 404 },
  );
}

function validationError(details: Record<string, string>): Response {
  return HttpResponse.json({ error: { code: "validation_error", details } }, { status: 422 });
}

export const batchesHandlers = [
  http.post(`${env.apiBaseUrl}/batches`, async ({ request }) => {
    await randomLatency();
    await applyForceDelay(request);
    const forcedError = forcedErrorResponse(request);
    if (forcedError) return forcedError;

    const formData = await request.formData().catch(() => null);
    const file = formData?.get("file");
    const mappingRaw = formData?.get("mapping");
    const jurisdictionRaw = formData?.get("jurisdiction");

    // Not `instanceof File`: MSW/undici's File and the test/browser runtime's
    // File can be different realms of the same interface. Duck-type instead.
    const isFileLike =
      file !== null &&
      typeof file === "object" &&
      "size" in file &&
      typeof file.size === "number" &&
      typeof (file as Blob).text === "function";
    if (!isFileLike) {
      return validationError({ file: "Choose a CSV file." });
    }
    const uploadedFile = file as File;
    if (uploadedFile.size > MAX_UPLOAD_BYTES) {
      return validationError({ file: "This file is larger than 5 MB." });
    }

    const jurisdictionResult = jurisdictionSchema.safeParse(jurisdictionRaw);
    if (!jurisdictionResult.success) {
      return validationError({ jurisdiction: "Choose a jurisdiction." });
    }

    let mapping: { description?: string };
    try {
      mapping = typeof mappingRaw === "string" ? JSON.parse(mappingRaw) : {};
    } catch {
      return validationError({ mapping: "Invalid column mapping." });
    }

    const text = await uploadedFile.text();
    const parsed = parseCsv(text);
    if (!parsed.ok) {
      return validationError({
        file:
          parsed.reason === "too_many_rows"
            ? "This file has more than 500 rows."
            : "We couldn't read this file. Check it's a valid CSV and try again.",
      });
    }

    const descriptionColumn = mapping.description;
    const descriptionIndex = descriptionColumn ? parsed.headers.indexOf(descriptionColumn) : -1;
    if (descriptionIndex === -1) {
      return validationError({ mapping: "Map the product description column." });
    }

    const descriptions = parsed.rows
      .map((row) => row[descriptionIndex]?.trim() ?? "")
      .filter((description) => description.length > 0);

    if (descriptions.length === 0) {
      return validationError({ file: "This file has no usable rows." });
    }

    const limits = currentPlanLimits();
    const rows = descriptions.length;

    if (limits.batch.uploadsPerMonth === 0 && limits.batch.maxRows === 0) {
      return planLimitReachedResponse("feature", 0, usageStore.batchUploadsUsed);
    }
    if (usageStore.batchUploadsUsed >= limits.batch.uploadsPerMonth) {
      return planLimitReachedResponse(
        "batch_uploads",
        limits.batch.uploadsPerMonth,
        usageStore.batchUploadsUsed,
      );
    }
    if (rows > limits.batch.maxRows) {
      return planLimitReachedResponse("batch_rows", limits.batch.maxRows, rows);
    }
    const remainingClassifications = limits.classifications.limit - usageStore.classificationsUsed;
    if (rows > remainingClassifications) {
      return planLimitReachedResponse(
        "classifications",
        limits.classifications.limit,
        usageStore.classificationsUsed,
      );
    }

    const batch = createBatch({
      filename: uploadedFile.name,
      jurisdiction: jurisdictionResult.data,
      descriptions,
    });
    usageStore.batchUploadsUsed += 1;
    usageStore.classificationsUsed += rows;

    return HttpResponse.json(toPublicBatch(batch), { status: 201 });
  }),

  http.get(`${env.apiBaseUrl}/batches/:id`, async ({ request, params }) => {
    await randomLatency();
    await applyForceDelay(request);
    const forcedError = forcedErrorResponse(request);
    if (forcedError) return forcedError;

    const batch = findBatch(String(params.id));
    if (!batch) return notFound();

    advanceBatch(batch);
    return HttpResponse.json(toPublicBatch(batch));
  }),

  http.get(`${env.apiBaseUrl}/batches/:id/items`, async ({ request, params }) => {
    await randomLatency();
    await applyForceDelay(request);
    const forcedError = forcedErrorResponse(request);
    if (forcedError) return forcedError;

    const batch = findBatch(String(params.id));
    if (!batch) return notFound();

    const url = new URL(request.url);
    const visible = batchClassifications(batch)
      .filter((item) => !isExpired(item))
      .map(withExpiresAt);
    const { items, total, page, pageSize } = applyClassificationListParams(visible, url);

    return HttpResponse.json({ items, total, page, pageSize });
  }),

  http.post(`${env.apiBaseUrl}/batches/:id/pause`, async ({ request, params }) => {
    await randomLatency();
    await applyForceDelay(request);
    const forcedError = forcedErrorResponse(request);
    if (forcedError) return forcedError;

    const batch = findBatch(String(params.id));
    if (!batch) return notFound();

    if (batch.status !== "complete") batch.status = "paused";
    return HttpResponse.json(toPublicBatch(batch));
  }),

  http.post(`${env.apiBaseUrl}/batches/:id/resume`, async ({ request, params }) => {
    await randomLatency();
    await applyForceDelay(request);
    const forcedError = forcedErrorResponse(request);
    if (forcedError) return forcedError;

    const batch = findBatch(String(params.id));
    if (!batch) return notFound();

    if (batch.status === "paused") batch.status = "processing";
    return HttpResponse.json(toPublicBatch(batch));
  }),

  http.post(`${env.apiBaseUrl}/batches/:id/bulk-approve`, async ({ request, params }) => {
    await randomLatency();
    await applyForceDelay(request);
    const forcedError = forcedErrorResponse(request);
    if (forcedError) return forcedError;

    const batch = findBatch(String(params.id));
    if (!batch) return notFound();

    const body = (await request.json().catch(() => ({}))) as { minConfidence?: number };
    const minConfidence = typeof body.minConfidence === "number" ? body.minConfidence : 90;

    const items = batchClassifications(batch);
    let approvedCount = 0;
    for (const item of items) {
      if (item.status !== "approved" && item.confidence >= minConfidence) {
        applyApproveTransition(item, undefined, "Sam Rivera");
        approvedCount += 1;
      }
    }

    return HttpResponse.json({ approvedCount });
  }),
];
