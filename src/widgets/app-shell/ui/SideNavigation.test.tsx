import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { SideNavigation } from "./SideNavigation";

describe("SideNavigation", () => {
  it("marks the current route as active with aria-current", () => {
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <SideNavigation onSignOut={vi.fn()} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /Workspace/ })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: /Library/ })).not.toHaveAttribute("aria-current");
  });

  it("calls onSignOut when Sign out is activated", async () => {
    const user = userEvent.setup();
    const onSignOut = vi.fn();
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <SideNavigation onSignOut={onSignOut} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: /Sign out/ }));
    expect(onSignOut).toHaveBeenCalledTimes(1);
  });

  it("calls onNavigate when a link is clicked", async () => {
    const user = userEvent.setup();
    const onNavigate = vi.fn();
    render(
      <MemoryRouter initialEntries={["/app"]}>
        <SideNavigation onSignOut={vi.fn()} onNavigate={onNavigate} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("link", { name: /Library/ }));
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});
