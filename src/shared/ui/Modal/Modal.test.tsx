import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "./Modal";

function Harness({ onOpenChange }: { onOpenChange?: () => void }) {
  const [open, setOpen] = useState(true);
  const openButtonRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={openButtonRef} onClick={() => setOpen(true)}>
        Open modal
      </button>
      <Modal
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          onOpenChange?.();
        }}
        title="Delete classification?"
        description="This removes the item from the workspace."
        returnFocusRef={openButtonRef}
      >
        <button>Confirm</button>
      </Modal>
    </>
  );
}

describe("Modal", () => {
  it("renders an accessible title and description while open", () => {
    render(<Harness />);
    expect(screen.getByRole("dialog", { name: "Delete classification?" })).toBeInTheDocument();
    expect(screen.getByText("This removes the item from the workspace.")).toBeInTheDocument();
  });

  it("traps focus inside the modal while open", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    await user.tab();
    expect(screen.getByRole("button", { name: "Confirm" })).toHaveFocus();
  });

  it("closes on Escape and returns focus to returnFocusRef's element", async () => {
    const user = userEvent.setup();
    render(<Harness />);

    const openButton = screen.getByRole("button", { name: "Open modal", hidden: true });
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(openButton).toHaveFocus();
  });

  it("closes on outside click", async () => {
    const onOpenChange = vi.fn();
    // Radix sets pointer-events: none on the body while the dialog is open,
    // so userEvent's default pointer-events check would reject this click.
    const user = userEvent.setup({ pointerEventsCheck: 0 });
    render(<Harness onOpenChange={onOpenChange} />);

    await user.click(document.body);

    expect(onOpenChange).toHaveBeenCalled();
  });
});
