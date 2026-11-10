import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Eyebrow } from "./Eyebrow";

describe("Eyebrow", () => {
  it("renders its children as a paragraph", () => {
    render(<Eyebrow>How it works</Eyebrow>);
    expect(screen.getByText("How it works", { selector: "p" })).toBeInTheDocument();
  });

  it("forwards native props such as className and id", () => {
    render(
      <Eyebrow className="custom" id="section-label">
        Measured, not assumed
      </Eyebrow>,
    );
    const node = screen.getByText("Measured, not assumed");
    expect(node).toHaveClass("custom");
    expect(node).toHaveAttribute("id", "section-label");
  });
});
