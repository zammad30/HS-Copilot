import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { TermsPage } from "./TermsPage";

describe("TermsPage", () => {
  it("renders the title and body copy", () => {
    render(
      <MemoryRouter>
        <TermsPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Terms" })).toBeInTheDocument();
    expect(
      screen.getByText(
        /HS Copilot provides research suggestions to support qualified human review/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 2, name: "Reviewer responsibility" }),
    ).toBeInTheDocument();
  });
});
