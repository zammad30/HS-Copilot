import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { StaticPage } from "./StaticPage";

function renderStaticPage() {
  return render(
    <MemoryRouter initialEntries={["/privacy"]}>
      <Routes>
        <Route
          path="/privacy"
          element={
            <StaticPage title="Privacy">
              <p>Intro paragraph.</p>
              <h2>Product data</h2>
              <p>Section paragraph.</p>
            </StaticPage>
          }
        />
        <Route path="/" element={<div>Landing reached</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("StaticPage", () => {
  it("renders the heading order H1 then H2, with no skipped levels", () => {
    renderStaticPage();
    expect(screen.getByRole("heading", { level: 1, name: "Privacy" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Product data" })).toBeInTheDocument();
  });

  it("sets the document title", () => {
    renderStaticPage();
    expect(document.title).toBe("Privacy | HS Copilot");
  });

  it("shows the placeholder notice next to the H1", () => {
    renderStaticPage();
    expect(screen.getByText("Sample text")).toBeInTheDocument();
    expect(
      screen.getByText("This page contains placeholder text and is not reviewed legal copy."),
    ).toBeInTheDocument();
  });

  it("the Back link navigates home", async () => {
    renderStaticPage();
    const backLink = screen.getByRole("link", { name: /back/i });
    expect(backLink).toHaveAttribute("href", "/");
  });

  it("shares the public footer with Privacy/Terms links", () => {
    renderStaticPage();
    expect(screen.getByRole("link", { name: "Privacy" })).toHaveAttribute("href", "/privacy");
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
  });
});
