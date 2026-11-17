import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Textarea } from "./Textarea";

describe("Textarea", () => {
  it("is controlled: typing calls onChange", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Textarea value="" onChange={handleChange} aria-label="Description" />);

    await user.type(screen.getByRole("textbox"), "a");

    expect(handleChange).toHaveBeenCalled();
  });

  it("reflects aria-invalid for styling and assistive tech", () => {
    render(<Textarea value="" onChange={() => {}} aria-label="Description" aria-invalid="true" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("blocks typing when disabled", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Textarea value="" onChange={handleChange} aria-label="Description" disabled />);

    await user.type(screen.getByRole("textbox"), "a");

    expect(handleChange).not.toHaveBeenCalled();
  });
});
