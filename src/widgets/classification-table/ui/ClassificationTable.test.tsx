import type { ComponentProps } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { useReviewDecision } from "@/features/review-decision";
import { useDeleteClassification } from "@/features/delete-classification";
import { ToastProvider } from "@/shared/ui/Toast";
import type { ToastDurations } from "@/shared/ui/Toast";
import type { Classification } from "@/entities/classification";
import { ClassificationTable } from "./ClassificationTable";

vi.mock("@/features/review-decision", async () => {
  const actual = await vi.importActual<typeof import("@/features/review-decision")>(
    "@/features/review-decision",
  );
  return { ...actual, useReviewDecision: vi.fn() };
});
vi.mock("@/features/delete-classification", () => ({ useDeleteClassification: vi.fn() }));

const mockedUseReviewDecision = vi.mocked(useReviewDecision);
const mockedUseDelete = vi.mocked(useDeleteClassification);

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

function renderTable(
  props: Partial<ComponentProps<typeof ClassificationTable>> = {},
  toastDurationMs?: Partial<ToastDurations>,
) {
  const router = createMemoryRouter(
    [
      {
        path: "/app/library",
        Component: () => (
          <ClassificationTable items={[]} emptyState={<p>Nothing here.</p>} {...props} />
        ),
      },
      { path: "/app/classifications/:id", Component: () => <p>Detail page</p> },
    ],
    { initialEntries: ["/app/library"] },
  );
  return render(
    <ToastProvider durationMs={toastDurationMs}>
      <RouterProvider router={router} />
    </ToastProvider>,
  );
}

describe("ClassificationTable", () => {
  const approveMutate = vi.fn();
  const deleteMutate = vi.fn();

  beforeEach(() => {
    mockedUseReviewDecision.mockReturnValue({
      mutate: approveMutate,
    } as unknown as ReturnType<typeof useReviewDecision>);
    mockedUseDelete.mockReturnValue({
      mutate: deleteMutate,
    } as unknown as ReturnType<typeof useDeleteClassification>);
    approveMutate.mockClear();
    deleteMutate.mockClear();
  });

  it("renders the emptyState when there are no items", () => {
    renderTable({ items: [] });
    expect(screen.getByText("Nothing here.")).toBeInTheDocument();
  });

  it("row menu has exactly Open, Approve, Copy code, Delete for a needs_review item", async () => {
    const items = [makeClassification()];
    const user = userEvent.setup();
    renderTable({ items });

    await user.click(screen.getByRole("button", { name: "Actions for Men's cotton T-shirt" }));
    const menuItems = await screen.findAllByRole("menuitem");
    expect(menuItems.map((item) => item.textContent)).toEqual([
      "Open",
      "Approve",
      "Copy code",
      "Delete",
    ]);
  });

  it("hides Approve for an already-approved item", async () => {
    const items = [makeClassification({ status: "approved" })];
    const user = userEvent.setup();
    renderTable({ items });

    await user.click(screen.getByRole("button", { name: "Actions for Men's cotton T-shirt" }));
    const menuItems = await screen.findAllByRole("menuitem");
    expect(menuItems.map((item) => item.textContent)).toEqual(["Open", "Copy code", "Delete"]);
  });

  it("shows both Approved and Overridden indicators for an overridden item", () => {
    const items = [makeClassification({ status: "approved", overridden: true })];
    renderTable({ items });
    expect(screen.getByText("Approved")).toBeInTheDocument();
    expect(screen.getByText("Overridden")).toBeInTheDocument();
  });

  it("approve calls the mutation and shows a success toast", async () => {
    const items = [makeClassification()];
    approveMutate.mockImplementation((_input: unknown, options?: { onSuccess?: () => void }) =>
      options?.onSuccess?.(),
    );
    const user = userEvent.setup();
    renderTable({ items });

    await user.click(screen.getByRole("button", { name: "Actions for Men's cotton T-shirt" }));
    await user.click(await screen.findByRole("menuitem", { name: "Approve" }));

    expect(approveMutate).toHaveBeenCalledWith(
      { id: "cls_1", action: "approve" },
      expect.anything(),
    );
    expect(await screen.findByRole("status")).toHaveTextContent("Classification approved");
  });

  it("copy code writes the effective code to the clipboard and shows a toast", async () => {
    const items = [
      makeClassification({ suggestedCode: "6109.10", overridden: true, finalCode: "6109.90" }),
    ];
    const user = userEvent.setup();
    const writeTextSpy = vi.spyOn(navigator.clipboard, "writeText").mockResolvedValue(undefined);
    renderTable({ items });

    await user.click(screen.getByRole("button", { name: "Actions for Men's cotton T-shirt" }));
    await user.click(await screen.findByRole("menuitem", { name: "Copy code" }));

    expect(writeTextSpy).toHaveBeenCalledWith("6109.90");
    expect(await screen.findByRole("status")).toHaveTextContent("HS code copied");
  });

  describe("delete with undo", () => {
    const SHORT_DURATIONS: ToastDurations = { default: 300, withAction: 800 };

    it("hides the row immediately and flushes the real delete after the window elapses", async () => {
      const items = [makeClassification()];
      const user = userEvent.setup();
      renderTable({ items }, SHORT_DURATIONS);

      await user.click(screen.getByRole("button", { name: "Actions for Men's cotton T-shirt" }));
      await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
      const dialog = await screen.findByRole("dialog", { name: "Delete classification?" });
      await user.click(within(dialog).getByRole("button", { name: "Delete" }));

      expect(screen.getByText("Nothing here.")).toBeInTheDocument();
      expect(deleteMutate).not.toHaveBeenCalled();

      await vi.waitFor(() => expect(deleteMutate).toHaveBeenCalledWith("cls_1"), {
        timeout: 3000,
      });
    });

    it("restores the row when Undo is clicked, and the real delete is never sent", async () => {
      const items = [makeClassification()];
      const onItemHiddenChange = vi.fn();
      const user = userEvent.setup();
      renderTable({ items, onItemHiddenChange }, SHORT_DURATIONS);

      await user.click(screen.getByRole("button", { name: "Actions for Men's cotton T-shirt" }));
      await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
      const dialog = await screen.findByRole("dialog", { name: "Delete classification?" });
      await user.click(within(dialog).getByRole("button", { name: "Delete" }));
      expect(onItemHiddenChange).toHaveBeenCalledWith("cls_1", true);

      await user.click(await screen.findByRole("button", { name: "Undo" }));
      expect(screen.getByText("Men's cotton T-shirt")).toBeInTheDocument();
      expect(onItemHiddenChange).toHaveBeenCalledWith("cls_1", false);

      await new Promise((resolve) => setTimeout(resolve, SHORT_DURATIONS.withAction + 500));
      expect(deleteMutate).not.toHaveBeenCalled();
    });
  });
});
