import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Candidate, Jurisdiction } from "@/entities/classification";
import { useReviewDecision } from "../api/useReviewDecision";
import { OverrideDialog } from "./OverrideDialog";

const CANDIDATES: Candidate[] = [
  { code: "8518.30.0000", title: "Wireless earphones", confidence: 88, reasoning: [] },
  {
    code: "8518.22.0000",
    title: "Wireless earphones (alternative)",
    confidence: 70,
    reasoning: [],
  },
];

interface HarnessProps {
  onOverridden?: () => void;
  jurisdiction?: Jurisdiction;
  candidates?: Candidate[];
}

function Harness({
  onOverridden = vi.fn(),
  jurisdiction = "US_HTS",
  candidates = CANDIDATES,
}: HarnessProps) {
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
        jurisdiction={jurisdiction}
        currentCode={candidates[0].code}
        candidates={candidates}
        decision={decision}
        returnFocusRef={openButtonRef}
        onOverridden={onOverridden}
      />
    </>
  );
}

function renderDialog(props?: HarnessProps) {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <Harness {...props} />
    </QueryClientProvider>,
  );
}

describe("OverrideDialog", () => {
  it("opens pre-selected to the current code, with every candidate code visible as an option", () => {
    renderDialog();
    const dialog = screen.getByRole("dialog");

    const select = within(dialog).getByLabelText("HS code") as HTMLSelectElement;
    expect(select.value).toBe("8518.30.0000");
    expect(
      within(dialog).getByRole("option", { name: "8518.30.0000 - Wireless earphones" }),
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole("option", {
        name: "8518.22.0000 - Wireless earphones (alternative)",
      }),
    ).toBeInTheDocument();
  });

  it("choosing the current code shows the inline error without clearing anything", async () => {
    const onOverridden = vi.fn();
    const user = userEvent.setup();
    renderDialog({ onOverridden });
    const dialog = screen.getByRole("dialog");

    await user.type(within(dialog).getByLabelText("Reason for override"), "Because");
    await user.click(within(dialog).getByRole("button", { name: "Confirm override" }));

    expect(screen.getByText("Choose a different code than the current one.")).toBeInTheDocument();
    expect(within(dialog).getByLabelText("Reason for override")).toHaveValue("Because");
    expect(onOverridden).not.toHaveBeenCalled();
  });

  it("choosing a different code and submitting a reason calls onOverridden on success", async () => {
    const onOverridden = vi.fn();
    const user = userEvent.setup();
    renderDialog({ onOverridden });
    const dialog = screen.getByRole("dialog");

    await user.selectOptions(within(dialog).getByLabelText("HS code"), "8518.22.0000");
    await user.type(
      within(dialog).getByLabelText("Reason for override"),
      "Better matches the product's principal use.",
    );
    await user.click(within(dialog).getByRole("button", { name: "Confirm override" }));

    await waitFor(() => expect(onOverridden).toHaveBeenCalledTimes(1), { timeout: 3000 });
  });

  it("requires a reason even once a different code is chosen", async () => {
    const user = userEvent.setup();
    renderDialog();
    const dialog = screen.getByRole("dialog");

    await user.selectOptions(within(dialog).getByLabelText("HS code"), "8518.22.0000");
    await user.click(within(dialog).getByRole("button", { name: "Confirm override" }));

    expect(screen.getByText("Enter a reason for the override.")).toBeInTheDocument();
  });

  it("cancel closes the dialog and returns focus to the opener", async () => {
    const user = userEvent.setup();
    renderDialog();
    const dialog = screen.getByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open override dialog" })).toHaveFocus();
  });

  it("validates the new code against the record's own destination", async () => {
    const onOverridden = vi.fn();
    const user = userEvent.setup();
    // Turkey needs 12 digits: a 10 digit candidate is the wrong length there.
    renderDialog({
      jurisdiction: "TR_GTIP",
      onOverridden,
      candidates: [
        { code: "8518.30.000000", title: "Wireless earphones", confidence: 88, reasoning: [] },
        { code: "8518.22.0000", title: "Wrong length", confidence: 70, reasoning: [] },
        { code: "8518.22.000000", title: "Right length", confidence: 60, reasoning: [] },
      ],
    });
    const dialog = screen.getByRole("dialog");

    await user.type(within(dialog).getByLabelText("Reason for override"), "Because");
    await user.selectOptions(within(dialog).getByLabelText("HS code"), "8518.22.0000");
    await user.click(within(dialog).getByRole("button", { name: "Confirm override" }));

    expect(
      screen.getByText("Enter a valid 12 digit code for this destination."),
    ).toBeInTheDocument();
    expect(onOverridden).not.toHaveBeenCalled();

    await user.selectOptions(within(dialog).getByLabelText("HS code"), "8518.22.000000");
    await user.click(within(dialog).getByRole("button", { name: "Confirm override" }));
    // The same dialog accepts the 12 digit code: no length error remains.
    expect(
      screen.queryByText("Enter a valid 12 digit code for this destination."),
    ).not.toBeInTheDocument();
  });
});
