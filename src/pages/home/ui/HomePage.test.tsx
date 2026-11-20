import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router";
import { useSession } from "@/entities/session";
import { useClassifications } from "@/entities/classification";
import type { Classification } from "@/entities/classification";
import { useReviewDecision } from "@/features/review-decision";
import { useDeleteClassification } from "@/features/delete-classification";
import { ToastProvider } from "@/shared/ui/Toast";
import type { ToastDurations } from "@/shared/ui/Toast";
import { HomePage } from "./HomePage";

vi.mock("@/entities/session", async () => {
  const actual = await vi.importActual<typeof import("@/entities/session")>("@/entities/session");
  return { ...actual, useSession: vi.fn() };
});
vi.mock("@/entities/classification", async () => {
  const actual = await vi.importActual<typeof import("@/entities/classification")>(
    "@/entities/classification",
  );
  return { ...actual, useClassifications: vi.fn() };
});
vi.mock("@/features/review-decision", async () => {
  const actual = await vi.importActual<typeof import("@/features/review-decision")>(
    "@/features/review-decision",
  );
  return { ...actual, useReviewDecision: vi.fn() };
});
vi.mock("@/features/delete-classification", () => ({ useDeleteClassification: vi.fn() }));

const mockedUseSession = vi.mocked(useSession);
const mockedUseClassifications = vi.mocked(useClassifications);
const mockedUseReviewDecision = vi.mocked(useReviewDecision);
const mockedUseDelete = vi.mocked(useDeleteClassification);

type QueryResult = ReturnType<typeof useClassifications>;

function queryResult(overrides: Partial<QueryResult>): QueryResult {
  return {
    data: undefined,
    isPending: false,
    isError: false,
    refetch: vi.fn(),
    ...overrides,
  } as QueryResult;
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
    confidence: 92,
    status: "needs_review",
    candidates: [],
    evidence: [],
    auditTrail: [],
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
    createdBy: "reviewer@hs-copilot.test",
    ...overrides,
  };
}

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{`${location.pathname}${location.search}`}</p>;
}

function renderHomePage(toastDurationMs?: Partial<ToastDurations>) {
  const router = createMemoryRouter(
    [
      { path: "/app", Component: HomePage },
      { path: "/app/classify/new", Component: LocationProbe },
      { path: "/app/library", Component: LocationProbe },
    ],
    { initialEntries: ["/app"] },
  );
  return render(
    <ToastProvider durationMs={toastDurationMs}>
      <RouterProvider router={router} />
    </ToastProvider>,
  );
}

describe("HomePage", () => {
  const approveMutate = vi.fn();
  const deleteMutate = vi.fn();

  beforeEach(() => {
    mockedUseSession.mockReturnValue({
      userId: "user_1",
      email: "reviewer@hs-copilot.test",
      workspaceId: "workspace_1",
    });
    mockedUseReviewDecision.mockReturnValue({
      mutate: approveMutate,
    } as unknown as ReturnType<typeof useReviewDecision>);
    mockedUseDelete.mockReturnValue({
      mutate: deleteMutate,
    } as unknown as ReturnType<typeof useDeleteClassification>);
    approveMutate.mockClear();
    deleteMutate.mockClear();
  });

  it("greets with no name when session.name is missing", () => {
    mockedUseClassifications.mockReturnValue(
      queryResult({ data: { items: [], total: 0, page: 1, pageSize: 50 } }),
    );
    renderHomePage();
    expect(screen.getByRole("heading", { level: 1 })).not.toHaveTextContent(",");
  });

  it("appends the session name to the greeting when present", () => {
    mockedUseSession.mockReturnValue({
      userId: "user_1",
      email: "reviewer@hs-copilot.test",
      workspaceId: "workspace_1",
      name: "Sam Rivera",
    });
    mockedUseClassifications.mockReturnValue(
      queryResult({ data: { items: [], total: 0, page: 1, pageSize: 50 } }),
    );
    renderHomePage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Sam Rivera");
  });

  it("derives the attention count and description from the data, not a hardcoded number", () => {
    const items = [
      makeClassification({ id: "a", status: "needs_review" }),
      makeClassification({ id: "b", status: "pending" }),
      makeClassification({ id: "c", status: "approved" }),
    ];
    mockedUseClassifications.mockReturnValue(
      queryResult({ data: { items, total: 3, page: 1, pageSize: 50 } }),
    );
    renderHomePage();
    expect(screen.getByText("2 need attention")).toBeInTheDocument();
    expect(screen.getByText("2 classifications are waiting for your review.")).toBeInTheDocument();
  });

  it("shows loading skeletons while pending, not a misleading zero count", () => {
    mockedUseClassifications.mockReturnValue(queryResult({ isPending: true }));
    renderHomePage();
    expect(screen.queryByText(/need attention/)).not.toBeInTheDocument();
    expect(screen.queryByText(/waiting for your review/)).not.toBeInTheDocument();
  });

  it("shows empty states when there is no data", () => {
    mockedUseClassifications.mockReturnValue(
      queryResult({ data: { items: [], total: 0, page: 1, pageSize: 50 } }),
    );
    renderHomePage();
    expect(screen.getByText("Nothing needs attention")).toBeInTheDocument();
    expect(screen.getByText("No classifications yet")).toBeInTheDocument();
  });

  it("shows an error card with Try again that calls refetch", async () => {
    const refetch = vi.fn();
    mockedUseClassifications.mockReturnValue(queryResult({ isError: true, refetch }));
    const user = userEvent.setup();
    renderHomePage();

    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  describe("delete with undo", () => {
    // Real timers with a short duration override - fake timers combined with
    // userEvent hang indefinitely here (confirmed by running vitest directly:
    // every test using them timed out at the wall-clock 5s limit). Production
    // never passes durationMs, so the real 6s window is unaffected.
    // Generous margins (not 40/80ms) so this stays reliable under a full,
    // loaded test run, not just in isolation.
    const SHORT_DURATIONS: ToastDurations = { default: 300, withAction: 800 };

    it("hides the row immediately and flushes the real delete after the window elapses", async () => {
      const items = [makeClassification({ id: "cls_1", description: "Men's cotton T-shirt" })];
      mockedUseClassifications.mockReturnValue(
        queryResult({ data: { items, total: 1, page: 1, pageSize: 50 } }),
      );
      const user = userEvent.setup();
      renderHomePage(SHORT_DURATIONS);

      await user.click(screen.getByRole("button", { name: "Actions for Men's cotton T-shirt" }));
      await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
      const dialog = await screen.findByRole("dialog", { name: "Delete classification?" });
      await user.click(within(dialog).getByRole("button", { name: "Delete" }));

      expect(screen.queryByText("Men's cotton T-shirt")).not.toBeInTheDocument();
      expect(deleteMutate).not.toHaveBeenCalled();

      await waitFor(() => expect(deleteMutate).toHaveBeenCalledWith("cls_1"), { timeout: 3000 });
    });

    it("restores the row when Undo is clicked, and the real delete is never sent", async () => {
      const items = [makeClassification({ id: "cls_1", description: "Men's cotton T-shirt" })];
      mockedUseClassifications.mockReturnValue(
        queryResult({ data: { items, total: 1, page: 1, pageSize: 50 } }),
      );
      const user = userEvent.setup();
      renderHomePage(SHORT_DURATIONS);

      await user.click(screen.getByRole("button", { name: "Actions for Men's cotton T-shirt" }));
      await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
      const dialog = await screen.findByRole("dialog", { name: "Delete classification?" });
      await user.click(within(dialog).getByRole("button", { name: "Delete" }));

      await user.click(await screen.findByRole("button", { name: "Undo" }));
      // Appears twice once restored - once in the review queue, once in the table.
      expect(screen.getAllByText("Men's cotton T-shirt").length).toBeGreaterThan(0);

      // Give the (cancelled) timer a chance to have fired if it hadn't been
      // cancelled, to prove the delete really is suppressed, not just not-yet-sent.
      await new Promise((resolve) => setTimeout(resolve, SHORT_DURATIONS.withAction + 500));
      expect(deleteMutate).not.toHaveBeenCalled();
    });
  });

  it("approve calls the mutation and shows a success toast", async () => {
    const items = [makeClassification({ id: "cls_1", description: "Men's cotton T-shirt" })];
    mockedUseClassifications.mockReturnValue(
      queryResult({ data: { items, total: 1, page: 1, pageSize: 50 } }),
    );
    approveMutate.mockImplementation((_input: unknown, options?: { onSuccess?: () => void }) =>
      options?.onSuccess?.(),
    );
    const user = userEvent.setup();
    renderHomePage();

    await user.click(screen.getByRole("button", { name: "Actions for Men's cotton T-shirt" }));
    await user.click(await screen.findByRole("menuitem", { name: "Approve" }));

    expect(approveMutate).toHaveBeenCalledWith(
      { id: "cls_1", action: "approve" },
      expect.anything(),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("Classification approved");
  });

  it("the quick-add field has an accessible label and navigates to classify-new with the typed text", async () => {
    mockedUseClassifications.mockReturnValue(
      queryResult({ data: { items: [], total: 0, page: 1, pageSize: 50 } }),
    );
    const user = userEvent.setup();
    renderHomePage();

    await user.type(screen.getByLabelText("Product description"), "vacuum bottle");
    await user.click(screen.getByRole("button", { name: "Classify" }));

    expect(await screen.findByTestId("location")).toHaveTextContent(
      "/app/classify/new?q=vacuum%20bottle",
    );
  });

  it("Review all links to the library filtered to needs_review and pending", () => {
    mockedUseClassifications.mockReturnValue(
      queryResult({ data: { items: [], total: 0, page: 1, pageSize: 50 } }),
    );
    renderHomePage();
    expect(screen.getByRole("link", { name: /Review all/ })).toHaveAttribute(
      "href",
      "/app/library?status=needs_review,pending",
    );
  });
});
