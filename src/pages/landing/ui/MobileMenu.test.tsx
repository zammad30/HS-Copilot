import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { MobileMenu } from "./MobileMenu";

function renderMenu(onClose = vi.fn()) {
  return {
    onClose,
    ...render(
      <MemoryRouter>
        <MobileMenu onClose={onClose} onLogoClick={() => {}} onOpenDemo={() => {}} />
      </MemoryRouter>,
    ),
  };
}

describe("MobileMenu", () => {
  it("renders all nav links and the Open demo workspace button", () => {
    renderMenu();
    expect(screen.getByRole("link", { name: "Methodology" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacy" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Terms" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open demo workspace" })).toBeInTheDocument();
  });

  it("calls onClose when the close button is clicked", async () => {
    const user = userEvent.setup();
    const { onClose } = renderMenu();
    await user.click(screen.getByRole("button", { name: "Close menu" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose on Escape", async () => {
    const user = userEvent.setup();
    const { onClose } = renderMenu();
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("calls onClose when a nav link is clicked", async () => {
    const user = userEvent.setup();
    const { onClose } = renderMenu();
    await user.click(screen.getByRole("link", { name: "Terms" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
