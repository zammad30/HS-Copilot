import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { Topbar } from "./Topbar";

function renderTopbar(props: Partial<Parameters<typeof Topbar>[0]> = {}) {
  return render(
    <MemoryRouter>
      <Topbar
        mobileNavOpen={false}
        onToggleMobileNav={vi.fn()}
        mobileNavId="mobile-nav"
        accountEmail="sam@hs-copilot.test"
        onSignOut={vi.fn()}
        {...props}
      />
    </MemoryRouter>,
  );
}

describe("Topbar", () => {
  it("shows the workspace name as static text", () => {
    renderTopbar({ workspaceName: "Sample workspace" });
    expect(screen.getByText("Sample workspace")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Sample workspace" })).not.toBeInTheDocument();
  });

  it("falls back to a generic label when workspaceName is missing", () => {
    renderTopbar({ workspaceName: undefined });
    expect(screen.getByText("Workspace")).toBeInTheDocument();
  });

  it("marks the hamburger with aria-expanded and aria-controls", () => {
    renderTopbar({ mobileNavOpen: true, mobileNavId: "mobile-nav" });
    const hamburger = screen.getByLabelText("Close navigation");
    expect(hamburger).toHaveAttribute("aria-expanded", "true");
    expect(hamburger).toHaveAttribute("aria-controls", "mobile-nav");
  });

  it("calls onToggleMobileNav when the hamburger is clicked", async () => {
    const user = userEvent.setup();
    const onToggleMobileNav = vi.fn();
    renderTopbar({ onToggleMobileNav });

    await user.click(screen.getByLabelText("Open navigation"));
    expect(onToggleMobileNav).toHaveBeenCalledTimes(1);
  });

  it("the help menu only has 'How classification works' and the legal footer", async () => {
    const user = userEvent.setup();
    renderTopbar();

    await user.click(screen.getByRole("button", { name: "Help" }));
    expect(
      await screen.findByRole("menuitem", { name: "How classification works" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("menuitem")).toHaveLength(1);
    expect(screen.getByText("Suggestions are not legal advice.")).toBeInTheDocument();
  });

  it("calls onSignOut from the account menu", async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn();
    renderTopbar({ onSignOut, accountName: "Sam Rivera" });

    await user.click(screen.getByRole("button", { name: "Open account menu" }));
    await user.click(await screen.findByRole("menuitem", { name: "Sign out" }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });
});
