import { useRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { MobileNavDrawer } from "./MobileNavDrawer";

function Harness({ onSignOut }: { onSignOut: () => void }) {
  const [open, setOpen] = useState(true);
  const hamburgerRef = useRef<HTMLButtonElement>(null);
  return (
    <>
      <button ref={hamburgerRef} onClick={() => setOpen(true)}>
        Open navigation
      </button>
      <MobileNavDrawer
        open={open}
        onOpenChange={setOpen}
        id="mobile-nav"
        onSignOut={onSignOut}
        returnFocusRef={hamburgerRef}
      />
    </>
  );
}

describe("MobileNavDrawer", () => {
  it("renders the nav links and a close button while open", () => {
    render(
      <MemoryRouter>
        <Harness onSignOut={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /Workspace/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Close navigation" })).toBeInTheDocument();
  });

  it("closes on Esc and returns focus to the hamburger that opened it", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Harness onSignOut={vi.fn()} />
      </MemoryRouter>,
    );

    const openButton = screen.getByRole("button", { name: "Open navigation", hidden: true });
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("link", { name: /Workspace/ })).not.toBeInTheDocument();
    expect(openButton).toHaveFocus();
  });

  it("closes when a nav link is clicked", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <Harness onSignOut={vi.fn()} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("link", { name: /Library/ }));
    expect(screen.queryByRole("link", { name: /Library/ })).not.toBeInTheDocument();
  });

  it("calls onSignOut and closes when Sign out is activated", async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn();
    render(
      <MemoryRouter>
        <Harness onSignOut={onSignOut} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /Sign out/ }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});
