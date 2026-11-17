import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { X } from "lucide-react";
import { IconButton } from "./IconButton";

describe("IconButton", () => {
  it("renders the required aria-label and icon", () => {
    render(<IconButton icon={<X />} aria-label="Close" />);
    expect(screen.getByRole("button", { name: "Close" })).toBeInTheDocument();
  });

  it('defaults to type="button" so it never submits a form', () => {
    render(<IconButton icon={<X />} aria-label="Close" />);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("calls onClick when activated", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<IconButton icon={<X />} aria-label="Close" onClick={handleClick} />);

    await user.click(screen.getByRole("button"));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("blocks activation when disabled", async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    render(<IconButton icon={<X />} aria-label="Close" onClick={handleClick} disabled />);

    await user.click(screen.getByRole("button"));

    expect(handleClick).not.toHaveBeenCalled();
  });
});
