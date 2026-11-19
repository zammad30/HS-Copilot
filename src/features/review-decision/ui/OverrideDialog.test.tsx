import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Candidate } from "@/entities/classification";
import { useReviewDecision } from "../api/useReviewDecision";
import { OverrideDialog } from "./OverrideDialog";

const CANDIDATES: Candidate[] = [
  { code: "8518.30", title: "Wireless earphones", confidence: 88, reasoning: [] },
  { code: "8518.22", title: "Wireless earphones (alternative)", confidence: 70, reasoning: [] },
];

function Harness({ onOverridden = vi.fn() }: { onOverridden?: () => void }) {
  const [open, setOpen] = useState(true);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const decision = useReviewDecision();
  return (
    <>
      <button ref={openButtonRef} onClick={() => setOpen(true)}>
        Open override dialog
      </button>
      <OverrideDialog
        open={open}
        onOpenChange={setOpen}
        classificationId="cls_002"
        currentCode="8518.30"
        candidates={CANDIDATES}
        decision={decision}
        returnFocusRef={openButtonRef}
        onOverridden={onOverridden}
      />
    </>
  );
}

function renderDialog(props?: Parameters<typeof Harness>[0]) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <Harness {...props} />
    </QueryClientProvider>,
  );
}

describe("OverrideDialog", () => {
  it("requires a valid, different HS code and a reason", async () => {
    const onOverridden = vi.fn();
    const user = userEvent.setup();
    renderDialog({ onOverridden });
    const dialog = screen.getByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: "Confirm override" }));
    expect(screen.getByText("Enter a valid HS code, for example 8518.30.")).toBeInTheDocument();
    expect(screen.getByText("Enter a reason for the override.")).toBeInTheDocument();

    await user.type(within(dialog).getByLabelText("Search HS code"), "8518.30");
    await user.type(within(dialog).getByLabelText("Reason for override"), "Because");
    await user.click(within(dialog).getByRole("button", { name: "Confirm override" }));
    expect(screen.getByText("Choose a code other than the current one.")).toBeInTheDocument();
    expect(onOverridden).not.toHaveBeenCalled();
  });

  it("submits a valid code and reason and calls onOverridden on success", async () => {
    const onOverridden = vi.fn();
    const user = userEvent.setup();
    renderDialog({ onOverridden });
    const dialog = screen.getByRole("dialog");

    await user.type(within(dialog).getByLabelText("Search HS code"), "8518.22");
    await user.type(
      within(dialog).getByLabelText("Reason for override"),
      "Better matches the product's principal use.",
    );
    await user.click(within(dialog).getByRole("button", { name: "Confirm override" }));

    await waitFor(() => expect(onOverridden).toHaveBeenCalledTimes(1), { timeout: 3000 });
  });

  it("cancel closes the dialog and returns focus to the opener", async () => {
    const user = userEvent.setup();
    renderDialog();
    const dialog = screen.getByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open override dialog" })).toHaveFocus();
  });
});
