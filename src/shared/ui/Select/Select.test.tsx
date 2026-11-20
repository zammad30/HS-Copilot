import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Select } from "./Select";

describe("Select", () => {
  it("renders the passed options and is controlled", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(
      <Select value="us" onChange={handleChange} aria-label="Jurisdiction">
        <option value="us">United States</option>
        <option value="eu">European Union</option>
      </Select>,
    );

    const select = screen.getByRole("combobox");
    expect(select).toHaveValue("us");

    await user.selectOptions(select, "eu");

    expect(handleChange).toHaveBeenCalled();
  });

  it("is a real native <select> element - no library needed", () => {
    render(
      <Select value="us" onChange={() => {}} aria-label="Jurisdiction">
        <option value="us">United States</option>
      </Select>,
    );
    expect(screen.getByRole("combobox").tagName).toBe("SELECT");
  });

  it("reflects aria-invalid for styling and assistive tech", () => {
    render(
      <Select value="us" onChange={() => {}} aria-label="Jurisdiction" aria-invalid="true">
        <option value="us">United States</option>
      </Select>,
    );
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-invalid", "true");
  });
});
