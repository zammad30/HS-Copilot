import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Logo } from "./Logo";

describe("Logo", () => {
  it("renders as a button with an aria-label", () => {
    render(<Logo onClick={() => {}} />);
    expect(screen.getByRole("button", { name: "HS Copilot home" })).toBeInTheDocument();
  });

  it("calls onClick when activated", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<Logo onClick={handleClick} />);

    await user.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
