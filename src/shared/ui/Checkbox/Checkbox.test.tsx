import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Checkbox } from "./Checkbox";

describe("Checkbox", () => {
  it("renders a label associated with the checkbox", () => {
    render(<Checkbox label="Select all visible rows" checked={false} onChange={() => {}} />);
    expect(screen.getByRole("checkbox", { name: "Select all visible rows" })).toBeInTheDocument();
  });

  it("is controlled: clicking calls onChange", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Checkbox label="Select row" checked={false} onChange={handleChange} />);

    await user.click(screen.getByRole("checkbox"));

    expect(handleChange).toHaveBeenCalledTimes(1);
  });

  it("reflects the checked prop", () => {
    render(<Checkbox label="Select row" checked onChange={() => {}} />);
    expect(screen.getByRole("checkbox")).toBeChecked();
  });

  it("blocks toggling when disabled", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<Checkbox label="Select row" checked={false} onChange={handleChange} disabled />);

    await user.click(screen.getByRole("checkbox"));

    expect(handleChange).not.toHaveBeenCalled();
  });
});
