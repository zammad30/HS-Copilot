import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useReviewDecision } from "../api/useReviewDecision";
import { RequestInfoDialog } from "./RequestInfoDialog";
import type { AssigneeOption } from "./RequestInfoDialog";

const ASSIGNEES: AssigneeOption[] = [
  { id: "member_alex_morgan", name: "Alex Morgan" },
  { id: "member_mina_patel", name: "Mina Patel" },
];

function Harness({ onRequested = vi.fn() }: { onRequested?: () => void }) {
  const [open, setOpen] = useState(true);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const decision = useReviewDecision();
  return (
    <>
      <button ref={openButtonRef} onClick={() => setOpen(true)}>
        Open ask-for-info dialog
      </button>
      <RequestInfoDialog
        open={open}
        onOpenChange={setOpen}
        classificationId="cls_002"
        assignees={ASSIGNEES}
        decision={decision}
        returnFocusRef={openButtonRef}
        onRequested={onRequested}
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

describe("RequestInfoDialog", () => {
  it("requires an assignee before sending", async () => {
    const onRequested = vi.fn();
    const user = userEvent.setup();
    renderDialog({ onRequested });
    const dialog = screen.getByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: "Send request" }));

    expect(screen.getByText("Select who should follow up.")).toBeInTheDocument();
    expect(onRequested).not.toHaveBeenCalled();
  });

  it("submits the assignee and optional note, and calls onRequested on success", async () => {
    const onRequested = vi.fn();
    const user = userEvent.setup();
    renderDialog({ onRequested });
    const dialog = screen.getByRole("dialog");

    await user.selectOptions(within(dialog).getByLabelText("Assign to"), "member_mina_patel");
    await user.type(within(dialog).getByLabelText("Note"), "Need the exact material blend.");
    await user.click(within(dialog).getByRole("button", { name: "Send request" }));

    await waitFor(() => expect(onRequested).toHaveBeenCalledTimes(1), { timeout: 3000 });
  });

  it("cancel closes the dialog and returns focus to the opener", async () => {
    const user = userEvent.setup();
    renderDialog();
    const dialog = screen.getByRole("dialog");

    await user.click(within(dialog).getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open ask-for-info dialog" })).toHaveFocus();
  });
});
