import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { MemoryRouter } from "react-router";
import { PublicHeader } from "./PublicHeader";

describe("PublicHeader", () => {
  it("renders nav links and the Open demo button", () => {
    render(
      <MemoryRouter>
        <PublicHeader
          onLogoClick={() => {}}
          onOpenDemo={() => {}}
          onOpenMenu={() => {}}
          hamburgerRef={createRef()}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: "Methodology" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open demo" })).toBeInTheDocument();
  });

  it("calls onOpenMenu when the hamburger is clicked", async () => {
    const user = userEvent.setup();
    const onOpenMenu = vi.fn();
    render(
      <MemoryRouter>
        <PublicHeader
          onLogoClick={() => {}}
          onOpenDemo={() => {}}
          onOpenMenu={onOpenMenu}
          hamburgerRef={createRef()}
        />
      </MemoryRouter>,
    );

    await user.click(screen.getByLabelText("Open menu"));
    expect(onOpenMenu).toHaveBeenCalledTimes(1);
  });
});
