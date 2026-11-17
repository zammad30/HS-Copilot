import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SearchField } from "./SearchField";

describe("SearchField", () => {
  it("requires and renders an aria-label", () => {
    render(<SearchField value="" onChange={() => {}} aria-label="Search products or HS codes" />);
    expect(
      screen.getByRole("searchbox", { name: "Search products or HS codes" }),
    ).toBeInTheDocument();
  });

  it("is controlled: typing calls onChange", async () => {
    const handleChange = vi.fn();
    const user = userEvent.setup();
    render(<SearchField value="" onChange={handleChange} aria-label="Search" />);

    await user.type(screen.getByRole("searchbox"), "a");

    expect(handleChange).toHaveBeenCalled();
  });

  it('is always type="search" even if a caller passes a different type', () => {
    render(<SearchField value="" onChange={() => {}} aria-label="Search" type="text" />);
    expect(screen.getByRole("searchbox")).toHaveAttribute("type", "search");
  });
});
