import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { CodeText } from "./CodeText";

describe("CodeText", () => {
  it("renders the code text", () => {
    render(<CodeText>8518.30</CodeText>);
    expect(screen.getByText("8518.30")).toBeInTheDocument();
  });

  it("renders a hero-size code without changing its text content", () => {
    render(<CodeText size="hero">8518.30</CodeText>);
    expect(screen.getByText("8518.30")).toBeInTheDocument();
  });
});
