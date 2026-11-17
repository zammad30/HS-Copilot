import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Meter } from "./Meter";

describe("Meter", () => {
  it("renders the value as text and in a value-based aria-label", () => {
    render(<Meter value={92} />);
    expect(screen.getByText("92%")).toBeInTheDocument();
    expect(screen.getByLabelText("92%")).toBeInTheDocument();
  });

  it("lets a caller supply a more specific aria-label", () => {
    render(<Meter value={92} aria-label="92% confidence" />);
    expect(screen.getByLabelText("92% confidence")).toBeInTheDocument();
  });

  it("clamps out-of-range values to 0-100", () => {
    render(<Meter value={140} />);
    expect(screen.getByText("100%")).toBeInTheDocument();
  });
});
