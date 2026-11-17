import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TextInput } from "./TextInput";

describe("TextInput", () => {
  it("is controlled: typing calls onChange and the value comes from the caller", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<TextInput value="" onChange={handleChange} aria-label="Name" />);

    await user.type(screen.getByRole("textbox"), "a");

    expect(handleChange).toHaveBeenCalled();
  });

  it("forwards native input attributes such as type and placeholder", () => {
    render(<TextInput value="" onChange={() => {}} type="email" placeholder="you@example.com" />);
    const input = screen.getByPlaceholderText("you@example.com");
    expect(input).toHaveAttribute("type", "email");
  });

  it("reflects aria-invalid for styling and assistive tech", () => {
    render(<TextInput value="" onChange={() => {}} aria-label="Name" aria-invalid="true" />);
    expect(screen.getByRole("textbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("blocks typing when disabled", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<TextInput value="" onChange={handleChange} aria-label="Name" disabled />);

    await user.type(screen.getByRole("textbox"), "a");

    expect(handleChange).not.toHaveBeenCalled();
  });
});
