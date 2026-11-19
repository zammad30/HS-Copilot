import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useReviewDecision } from "../api/useReviewDecision";
import { RejectDialog } from "./RejectDialog";

function Harness({
  classificationId = "cls_002",
  onRejected = vi.fn(),
}: {
  classificationId?: string;
  onRejected?: () => void;
}) {
  const [open, setOpen] = useState(true);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const decision = useReviewDecision();
  return (
    <>
      <button ref={openButtonRef} onClick={() => setOpen(true)}>
        Open reject dialog
      </button>
      <RejectDialog
        open={open}
        onOpenChange={setOpen}
        classificationId={classificationId}
        decision={decision}
        returnFocusRef={openButtonRef}
        onRejected={onRejected}
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

describe("RejectDialog", () => {
  it("shows a validation error and does not submit when the reason is empty", async () => {
    const onRejected = vi.fn();
    const user = userEvent.setup();
    renderDialog({ onRejected });
    const dialog = screen.getByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: "Reject" }));

    expect(
      screen.getByText("Enter a reason for rejecting this classification."),
    ).toBeInTheDocument();
    expect(onRejected).not.toHaveBeenCalled();
  });

  it("submits the reason and calls onRejected on success", async () => {
    const onRejected = vi.fn();
    const user = userEvent.setup();
    renderDialog({ onRejected });
    const dialog = screen.getByRole("dialog");

    await user.type(within(dialog).getByLabelText("Reason"), "Does not match the heading.");
    await user.click(within(dialog).getByRole("button", { name: "Reject" }));

    await waitFor(() => expect(onRejected).toHaveBeenCalledTimes(1), { timeout: 3000 });
  });

  it("cancel closes the dialog and returns focus to the opener, without submitting", async () => {
    const onRejected = vi.fn();
    const user = userEvent.setup();
    renderDialog({ onRejected });
    const dialog = screen.getByRole("dialog");

    await user.type(within(dialog).getByLabelText("Reason"), "Some reason");
    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open reject dialog" })).toHaveFocus();
    expect(onRejected).not.toHaveBeenCalled();
  });
});
