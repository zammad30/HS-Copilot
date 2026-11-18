import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { ClassificationStatusBadge } from "./ClassificationStatusBadge";

describe("ClassificationStatusBadge", () => {
  it("maps needs_review to the needs-review StatusIndicator", () => {
    render(<ClassificationStatusBadge status="needs_review" />);
    expect(screen.getByText("Needs review")).toBeInTheDocument();
  });

  it("shows Overridden instead of Approved when overridden is true", () => {
    render(<ClassificationStatusBadge status="approved" overridden />);
    expect(screen.getByText("Overridden")).toBeInTheDocument();
    expect(screen.queryByText("Approved")).not.toBeInTheDocument();
  });

  it("shows the plain status when not overridden", () => {
    render(<ClassificationStatusBadge status="approved" />);
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });
});
