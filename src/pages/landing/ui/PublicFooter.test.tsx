import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { PublicFooter } from "./PublicFooter";

describe("PublicFooter", () => {
  it("renders the tagline and footer links", () => {
    render(
      <MemoryRouter>
        <PublicFooter onLogoClick={() => {}} />
      </MemoryRouter>,
    );

    expect(screen.getByText("AI-assisted research. Human-reviewed decisions.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Methodology" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Privacy" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Terms" })).toBeInTheDocument();
    expect(screen.getByText("© 2026")).toBeInTheDocument();
  });

  it("calls onLogoClick when the wordmark is clicked", async () => {
    const user = userEvent.setup();
    const onLogoClick = vi.fn();
    render(
      <MemoryRouter>
        <PublicFooter onLogoClick={onLogoClick} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole("button", { name: "HS Copilot home" }));
    expect(onLogoClick).toHaveBeenCalledTimes(1);
  });
});
