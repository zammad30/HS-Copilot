import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SampleLabel } from "./SampleLabel";

describe("SampleLabel", () => {
  it('defaults to "Sample data"', () => {
    render(<SampleLabel />);
    expect(screen.getByText("Sample data")).toBeInTheDocument();
  });

  it("renders custom children when given", () => {
    render(<SampleLabel>Sample ruling</SampleLabel>);
    expect(screen.getByText("Sample ruling")).toBeInTheDocument();
  });
});
