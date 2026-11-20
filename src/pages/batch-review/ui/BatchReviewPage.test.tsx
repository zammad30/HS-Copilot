import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { useBatch, useBatchItems } from "@/entities/batch";
import type { Batch } from "@/entities/batch";
import { useReviewRules } from "@/entities/review-rule";
import type { Classification } from "@/entities/classification";
import { useReviewDecision } from "@/features/review-decision";
import { useDeleteClassification } from "@/features/delete-classification";
import { ApiError } from "@/shared/api";
import { ToastProvider } from "@/shared/ui/Toast";
import { BatchReviewPage } from "./BatchReviewPage";
import { usePauseBatch, useResumeBatch, useBulkApprove } from "../api/useBatchControls";

vi.mock("@/entities/batch", async () => {
  const actual = await vi.importActual<typeof import("@/entities/batch")>("@/entities/batch");
  return { ...actual, useBatch: vi.fn(), useBatchItems: vi.fn() };
});
vi.mock("@/entities/review-rule", async () => {
  const actual =
    await vi.importActual<typeof import("@/entities/review-rule")>("@/entities/review-rule");
  return { ...actual, useReviewRules: vi.fn() };
});
vi.mock("@/features/review-decision", async () => {
  const actual = await vi.importActual<typeof import("@/features/review-decision")>(
    "@/features/review-decision",
  );
  return { ...actual, useReviewDecision: vi.fn() };
});
vi.mock("@/features/delete-classification", () => ({ useDeleteClassification: vi.fn() }));
vi.mock("../api/useBatchControls", () => ({
  usePauseBatch: vi.fn(),
  useResumeBatch: vi.fn(),
  useBulkApprove: vi.fn(),
}));

const mockedUseBatch = vi.mocked(useBatch);
const mockedUseBatchItems = vi.mocked(useBatchItems);
const mockedUseReviewRules = vi.mocked(useReviewRules);
const mockedUseReviewDecision = vi.mocked(useReviewDecision);
const mockedUseDelete = vi.mocked(useDeleteClassification);
const mockedUsePause = vi.mocked(usePauseBatch);
const mockedUseResume = vi.mocked(useResumeBatch);
const mockedUseBulkApprove = vi.mocked(useBulkApprove);

type BatchQueryResult = ReturnType<typeof useBatch>;
type ItemsQueryResult = ReturnType<typeof useBatchItems>;
type ReviewRulesQueryResult = ReturnType<typeof useReviewRules>;

function batchResult(overrides: Partial<BatchQueryResult>): BatchQueryResult {
  return {
    data: undefined,
    isPending: false,
    isError: false,
    error: null,
    refetch: vi.fn(),
    ...overrides,
  } as BatchQueryResult;
}

function itemsResult(overrides: Partial<ItemsQueryResult>): ItemsQueryResult {
  return {
    data: undefined,
    isPending: false,
    isFetching: false,
    isError: false,
    ...overrides,
  } as ItemsQueryResult;
}

function makeBatch(overrides: Partial<Batch> = {}): Batch {
  return {
    id: "batch_1",
    filename: "june_apparel_import.csv",
    total: 10,
    classified: 4,
    status: "processing",
    jurisdiction: "US_HTS",
    startedAt: "2026-11-19T13:00:00.000Z",
    ...overrides,
  };
}

function makeClassification(overrides: Partial<Classification> = {}): Classification {
  return {
    id: "cls_1",
    workspaceId: "workspace_1",
    description: "Men's cotton T-shirt",
    attributes: {},
    jurisdiction: "US_HTS",
    suggestedCode: "6109.10",
    overridden: false,
    confidence: 95,
    status: "pending",
    candidates: [],
    evidence: [],
    auditTrail: [],
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
    createdBy: "reviewer@hs-copilot.test",
    expiresAt: "2027-11-01T00:00:00.000Z",
    ...overrides,
  };
}

function reviewRulesResult(highlightAbove = 90): ReviewRulesQueryResult {
  return {
    data: {
      highlightAbove,
      requireReviewBelow: 80,
      requireClarifyingQuestion: true,
      requireOverrideReason: true,
      secondApproverChapters: [],
    },
    isPending: false,
  } as unknown as ReviewRulesQueryResult;
}

function renderPage(initialPath = "/app/batches/batch_1") {
  const router = createMemoryRouter(
    [
      { path: "/app/batches/:id", Component: BatchReviewPage },
      { path: "/app/batches/new", Component: () => <p>Upload page</p> },
    ],
    { initialEntries: [initialPath] },
  );
  return render(
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>,
  );
}

describe("BatchReviewPage", () => {
  beforeEach(() => {
    mockedUseReviewRules.mockReturnValue(reviewRulesResult());
    mockedUseReviewDecision.mockReturnValue({
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useReviewDecision>);
    mockedUseDelete.mockReturnValue({
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useDeleteClassification>);
    mockedUsePause.mockReturnValue({ mutate: vi.fn() } as unknown as ReturnType<
      typeof usePauseBatch
    >);
    mockedUseResume.mockReturnValue({ mutate: vi.fn() } as unknown as ReturnType<
      typeof useResumeBatch
    >);
    mockedUseBulkApprove.mockReturnValue({
      mutate: vi.fn(),
      isPending: false,
    } as unknown as ReturnType<typeof useBulkApprove>);
  });

  it("shows a skeleton while the batch's first load is pending", () => {
    mockedUseBatch.mockReturnValue(batchResult({ isPending: true }));
    mockedUseBatchItems.mockReturnValue(itemsResult({ isPending: true }));
    renderPage();
    expect(screen.queryByText(/classified/)).not.toBeInTheDocument();
  });

  it("shows the progress banner with real status and Pause while processing", () => {
    mockedUseBatch.mockReturnValue(batchResult({ data: makeBatch() }));
    mockedUseBatchItems.mockReturnValue(
      itemsResult({ data: { items: [], total: 0, page: 1, pageSize: 10 } }),
    );
    renderPage();

    expect(screen.getByRole("status")).toHaveTextContent("4 of 10 classified · Processing");
    expect(screen.getByRole("button", { name: "Pause" })).toBeInTheDocument();
  });

  it("hides the progress banner once the batch is complete", () => {
    mockedUseBatch.mockReturnValue(
      batchResult({ data: makeBatch({ status: "complete", classified: 10 }) }),
    );
    mockedUseBatchItems.mockReturnValue(
      itemsResult({ data: { items: [], total: 0, page: 1, pageSize: 10 } }),
    );
    renderPage();

    expect(screen.queryByText(/classified/)).not.toBeInTheDocument();
  });

  it("derives the bulk-approve count and threshold, and opens the confirm modal", async () => {
    const user = userEvent.setup();
    mockedUseBatch.mockReturnValue(batchResult({ data: makeBatch() }));
    mockedUseBatchItems.mockReturnValue(
      itemsResult({
        data: {
          items: [
            makeClassification({ id: "a", confidence: 95, status: "pending" }),
            makeClassification({ id: "b", confidence: 60, status: "pending" }),
            makeClassification({ id: "c", confidence: 92, status: "approved" }),
          ],
          total: 3,
          page: 1,
          pageSize: 500,
        },
      }),
    );
    renderPage();

    const bulkButton = screen.getByRole("button", { name: "Approve 1 above 90%" });
    expect(bulkButton).toBeEnabled();
    await user.click(bulkButton);

    expect(screen.getByText("Approve 1 classifications?")).toBeInTheDocument();
    expect(
      screen.getByText(
        "This approves 1 classifications with confidence of 90% or higher. Each decision is logged.",
      ),
    ).toBeInTheDocument();
  });

  it("disables bulk-approve when no items are eligible", () => {
    mockedUseBatch.mockReturnValue(batchResult({ data: makeBatch() }));
    mockedUseBatchItems.mockReturnValue(
      itemsResult({
        data: { items: [makeClassification({ confidence: 50 })], total: 1, page: 1, pageSize: 500 },
      }),
    );
    renderPage();

    expect(screen.getByRole("button", { name: "Approve 0 above 90%" })).toBeDisabled();
  });

  it("shows dedicated not-found copy with a link to upload a new batch for a 404", () => {
    mockedUseBatch.mockReturnValue(
      batchResult({
        isError: true,
        error: new ApiError("Not found", { code: "not_found", status: 404 }),
      }),
    );
    mockedUseBatchItems.mockReturnValue(
      itemsResult({ data: { items: [], total: 0, page: 1, pageSize: 10 } }),
    );
    renderPage();

    expect(screen.getByText("We couldn't find this batch.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Upload a new batch" })).toBeInTheDocument();
  });

  it("shows the generic error state with Try again for a non-404 failure", () => {
    mockedUseBatch.mockReturnValue(
      batchResult({
        isError: true,
        error: new ApiError("Server error", { code: "server_error", status: 500 }),
      }),
    );
    mockedUseBatchItems.mockReturnValue(
      itemsResult({ data: { items: [], total: 0, page: 1, pageSize: 10 } }),
    );
    renderPage();

    expect(screen.getByText("We couldn't load this batch")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
  });
});
