import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { PrivacyPage } from "./PrivacyPage";

describe("PrivacyPage", () => {
  it("renders the title and body copy", () => {
    render(
      <MemoryRouter>
        <PrivacyPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { level: 1, name: "Privacy" })).toBeInTheDocument();
    expect(
      screen.getByText(/We use workspace data only to provide classification research/),
    ).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Product data" })).toBeInTheDocument();
  });
});
