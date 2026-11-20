import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router";
import { useClassifications } from "@/entities/classification";
import type { Classification } from "@/entities/classification";
import { useReviewDecision } from "@/features/review-decision";
import { useDeleteClassification } from "@/features/delete-classification";
import { ToastProvider } from "@/shared/ui/Toast";
import { LibraryPage } from "./LibraryPage";

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

const mockedUseClassifications = vi.mocked(useClassifications);
const mockedUseReviewDecision = vi.mocked(useReviewDecision);
const mockedUseDelete = vi.mocked(useDeleteClassification);

type QueryResult = ReturnType<typeof useClassifications>;

function queryResult(overrides: Partial<QueryResult>): QueryResult {
  return {
    data: undefined,
    isPending: false,
    isFetching: false,
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
    expiresAt: "2027-11-01T00:00:00.000Z",
    ...overrides,
  };
}

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{`${location.pathname}${location.search}`}</p>;
}

function renderLibrary(initialPath = "/app/library") {
  const router = createMemoryRouter(
    [
      {
        path: "/app/library",
        Component: () => (
          <>
            <LibraryPage />
            <LocationProbe />
          </>
        ),
      },
      { path: "/app/classify/new", Component: LocationProbe },
      { path: "/app/classifications/:id", Component: () => <p>Detail page</p> },
    ],
    { initialEntries: [initialPath] },
  );
  return render(
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>,
  );
}

describe("LibraryPage", () => {
  beforeEach(() => {
    mockedUseReviewDecision.mockReturnValue({
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useReviewDecision>);
    mockedUseDelete.mockReturnValue({
      mutate: vi.fn(),
    } as unknown as ReturnType<typeof useDeleteClassification>);
  });

  it("shows a table-shaped skeleton while the first load is pending", () => {
    mockedUseClassifications.mockReturnValue(queryResult({ isPending: true }));
    renderLibrary();
    expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
  });

  it("pre-checks the status boxes from the URL and ignores unknown values", () => {
    mockedUseClassifications.mockReturnValue(
      queryResult({ data: { items: [], total: 0, page: 1, pageSize: 10 } }),
    );
    renderLibrary("/app/library?status=needs_review,pending,bogus");

    expect(screen.getByLabelText("Needs review")).toBeChecked();
    expect(screen.getByLabelText("Pending")).toBeChecked();
    expect(screen.getByLabelText("Approved")).not.toBeChecked();
    expect(screen.getByLabelText("Rejected")).not.toBeChecked();
  });

  it("toggling a status checkbox updates the URL and resets the page", async () => {
    mockedUseClassifications.mockReturnValue(
      queryResult({ data: { items: [], total: 0, page: 1, pageSize: 10 } }),
    );
    const user = userEvent.setup();
    renderLibrary("/app/library?page=2");

    await user.click(screen.getByLabelText("Approved"));

    await waitFor(() =>
      expect(screen.getByTestId("location")).toHaveTextContent("status=approved"),
    );
    expect(screen.getByTestId("location")).toHaveTextContent("page=1");
  });

  it("typing in search debounces a write of q to the URL and resets the page", async () => {
    mockedUseClassifications.mockReturnValue(
      queryResult({ data: { items: [], total: 0, page: 1, pageSize: 10 } }),
    );
    const user = userEvent.setup();
    renderLibrary("/app/library?page=2");

    await user.type(screen.getByLabelText("Search classifications"), "earbuds");

    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("q=earbuds"), {
      timeout: 2000,
    });
    expect(screen.getByTestId("location")).toHaveTextContent("page=1");
  });

  it("shows the no-data empty state with a New classification link when nothing exists", () => {
    mockedUseClassifications.mockReturnValue(
      queryResult({ data: { items: [], total: 0, page: 1, pageSize: 10 } }),
    );
    renderLibrary();
    expect(screen.getByText("No classifications yet")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "New classification" })).toBeInTheDocument();
  });

  it("shows the filtered empty state with Clear filters when filters are active", async () => {
    mockedUseClassifications.mockReturnValue(
      queryResult({ data: { items: [], total: 0, page: 1, pageSize: 10 } }),
    );
    const user = userEvent.setup();
    renderLibrary("/app/library?status=approved");

    expect(screen.getByText("No classifications match these filters.")).toBeInTheDocument();

    const clearButtons = screen.getAllByRole("button", { name: "Clear filters" });
    expect(clearButtons).toHaveLength(2);

    await user.click(clearButtons[clearButtons.length - 1]);
    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/app/library"));
    expect(screen.getByTestId("location")).not.toHaveTextContent("status=");
  });

  it("shows the filter-row Clear filters button only when a filter is active", () => {
    const items = [makeClassification()];
    mockedUseClassifications.mockReturnValue(
      queryResult({ data: { items, total: 1, page: 1, pageSize: 10 } }),
    );
    renderLibrary();
    expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();

    renderLibrary("/app/library?status=approved");
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
  });

  it("filter-row Clear filters removes q, status and page, and focuses the search field", async () => {
    const items = [makeClassification()];
    mockedUseClassifications.mockReturnValue(
      queryResult({ data: { items, total: 100, page: 3, pageSize: 10 } }),
    );
    const user = userEvent.setup();
    renderLibrary("/app/library?q=earbuds&status=approved&page=3");

    await user.click(screen.getByRole("button", { name: "Clear filters" }));

    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("/app/library"));
    expect(screen.getByTestId("location")).not.toHaveTextContent("q=");
    expect(screen.getByTestId("location")).not.toHaveTextContent("status=");
    expect(screen.getByTestId("location")).not.toHaveTextContent("page=");
    expect(screen.getByLabelText("Search classifications")).toHaveFocus();
  });

  it("shows an error state with a working Try again", async () => {
    const refetch = vi.fn();
    mockedUseClassifications.mockReturnValue(queryResult({ isError: true, refetch }));
    const user = userEvent.setup();
    renderLibrary();

    expect(screen.getByText("We couldn't load the library")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it("renders rows with product link, Updated column and pagination range", () => {
    const items = [makeClassification({ updatedAt: new Date().toISOString() })];
    mockedUseClassifications.mockReturnValue(
      queryResult({ data: { items, total: 14, page: 1, pageSize: 10 } }),
    );
    renderLibrary();

    expect(screen.getByRole("link", { name: /Men's cotton T-shirt/ })).toHaveAttribute(
      "href",
      "/app/classifications/cls_1",
    );
    expect(screen.getByText("Today")).toBeInTheDocument();
    expect(screen.getByText("Showing 1–10 of 14")).toBeInTheDocument();
  });

  it("Previous/Next change the page in the URL and are disabled at the boundaries", async () => {
    const items = [makeClassification()];
    mockedUseClassifications.mockReturnValue(
      queryResult({ data: { items, total: 14, page: 1, pageSize: 10 } }),
    );
    const user = userEvent.setup();
    renderLibrary();

    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("page=2"));
  });

  it("clamps an out-of-range page once the total is known", async () => {
    mockedUseClassifications.mockReturnValue(
      queryResult({ data: { items: [], total: 14, page: 2, pageSize: 10 } }),
    );
    renderLibrary("/app/library?page=99");

    await waitFor(() => expect(screen.getByTestId("location")).toHaveTextContent("page=2"));
  });

  it("row menu approve shows a success toast", async () => {
    const items = [makeClassification()];
    mockedUseClassifications.mockReturnValue(
      queryResult({ data: { items, total: 1, page: 1, pageSize: 10 } }),
    );
    const approveMutate = vi.fn((_input: unknown, options?: { onSuccess?: () => void }) =>
      options?.onSuccess?.(),
    );
    mockedUseReviewDecision.mockReturnValue({
      mutate: approveMutate,
    } as unknown as ReturnType<typeof useReviewDecision>);
    const user = userEvent.setup();
    renderLibrary();

    await user.click(screen.getByRole("button", { name: "Actions for Men's cotton T-shirt" }));
    await user.click(await screen.findByRole("menuitem", { name: "Approve" }));

    expect(await screen.findByRole("status")).toHaveTextContent("Classification approved");
  });

  it("row menu delete shows the confirm modal and removes the row with Undo offered", async () => {
    const items = [makeClassification()];
    mockedUseClassifications.mockReturnValue(
      queryResult({ data: { items, total: 1, page: 1, pageSize: 10 } }),
    );
    const user = userEvent.setup();
    renderLibrary();

    await user.click(screen.getByRole("button", { name: "Actions for Men's cotton T-shirt" }));
    await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
    const dialog = await screen.findByRole("dialog", { name: "Delete classification?" });
    expect(dialog).toHaveTextContent(`This removes "Men's cotton T-shirt" from the workspace.`);
    await user.click(within(dialog).getByRole("button", { name: "Delete" }));

    expect(await screen.findByRole("button", { name: "Undo" })).toBeInTheDocument();
  });
});
