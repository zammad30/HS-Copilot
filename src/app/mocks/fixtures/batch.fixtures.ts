import type { Batch, BatchStatus } from "@/entities/batch";
import { mockNow } from "../support/mockNow";
import { classificationsStore } from "./classifications.fixtures";
import type { StoredClassification } from "./classifications.fixtures";

/**
 * Mock-only record: the public `Batch` fields plus `classificationIds`,
 * which tracks which rows in the shared classification store belong to this
 * batch. `classificationIds` is never part of the contract's `Batch` shape
 * and is stripped before any response is sent (see `toPublicBatch`).
 */
export interface BatchFixture extends Batch {
  classificationIds: string[];
}

function toPublicBatch(batch: BatchFixture): Batch {
  const { id, filename, total, classified, status, jurisdiction, startedAt } = batch;
  return { id, filename, total, classified, status, jurisdiction, startedAt };
}

/** One seed in-flight batch, built from a slice of the existing classification
 * fixtures (re-flagged as this batch's rows), so `/app/batches/<id>` works as
 * a direct deep link in dev without inventing new hardcoded records. */
const SEED_BATCH_ID = "batch_seed_001";
const SEED_CLASSIFICATION_IDS = ["cls_005", "cls_009", "cls_012", "cls_013"];

function createBatchesFixture(): BatchFixture[] {
  return [
    {
      id: SEED_BATCH_ID,
      filename: "june_apparel_import.csv",
      total: SEED_CLASSIFICATION_IDS.length,
      classified: 1,
      status: "processing",
      jurisdiction: "US_HTS",
      startedAt: new Date(mockNow() - 2 * 60 * 60 * 1000).toISOString(),
      classificationIds: [...SEED_CLASSIFICATION_IDS],
    },
  ];
}

export const batchesStore: BatchFixture[] = createBatchesFixture();

export function resetBatchesStore(): void {
  batchesStore.splice(0, batchesStore.length, ...createBatchesFixture());
}

export function findBatch(id: string): BatchFixture | undefined {
  return batchesStore.find((batch) => batch.id === id);
}

export function batchClassifications(batch: BatchFixture): StoredClassification[] {
  const ids = new Set(batch.classificationIds);
  return classificationsStore.filter((item) => ids.has(item.id));
}

let batchSequence = 0;

/** Creates a new batch and N new pending classifications (one per CSV row),
 * pushed into the shared classification store, per docs/pages/batch.md. */
export function createBatch(input: {
  filename: string;
  jurisdiction: Batch["jurisdiction"];
  descriptions: string[];
}): BatchFixture {
  batchSequence += 1;
  const id = `batch_${mockNow()}_${batchSequence}`;
  const now = new Date(mockNow()).toISOString();

  const classificationIds = input.descriptions.map((description, index) => {
    const classificationId = `cls_batch_${batchSequence}_${index + 1}`;
    const newClassification: StoredClassification = {
      id: classificationId,
      workspaceId: "workspace_mock_1",
      description,
      attributes: {},
      jurisdiction: input.jurisdiction,
      suggestedCode: "",
      finalCode: undefined,
      overridden: false,
      confidence: 0,
      status: "pending",
      candidates: [],
      evidence: [],
      auditTrail: [
        {
          id: `${classificationId}_audit_1`,
          at: now,
          actor: "AI agent",
          action: "created",
          detail: "Created from a batch upload, awaiting research.",
        },
      ],
      createdAt: now,
      updatedAt: now,
      createdBy: "reviewer@hs-copilot.test",
    };
    classificationsStore.push(newClassification);
    return classificationId;
  });

  const batch: BatchFixture = {
    id,
    filename: input.filename,
    total: classificationIds.length,
    classified: 0,
    status: "processing",
    jurisdiction: input.jurisdiction,
    startedAt: now,
    classificationIds,
  };
  batchesStore.push(batch);
  return batch;
}

/**
 * Advances a batch one step per poll, mirroring the agent-run mock's
 * advance-per-poll pattern: never a client timer. `classified` moves toward
 * `total` by a small fixed increment, passing through `throttled` for one
 * poll partway through, and settles at `complete` once fully classified.
 */
export function advanceBatch(batch: BatchFixture): BatchFixture {
  if (batch.status === "complete" || batch.status === "paused") return batch;

  const increment = Math.max(1, Math.ceil(batch.total / 8));
  const nextClassified = Math.min(batch.total, batch.classified + increment);
  const isHalfway = nextClassified * 2 >= batch.total && batch.classified * 2 < batch.total;

  batch.classified = nextClassified;
  batch.status =
    nextClassified >= batch.total ? "complete" : isHalfway ? "throttled" : "processing";

  return batch;
}

export { toPublicBatch };
export type { BatchStatus };
