import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { MethodologyPage } from "./MethodologyPage";

function renderMethodologyPage() {
  return render(
    <MemoryRouter initialEntries={["/methodology"]}>
      <Routes>
        <Route path="/methodology" element={<MethodologyPage />} />
        <Route path="/" element={<div>Landing reached</div>} />
        <Route path="/app" element={<div>App reached</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("MethodologyPage", () => {
  it("renders the article header and how-it-works steps", () => {
    renderMethodologyPage();
    expect(
      screen.getByRole("heading", { level: 1, name: "A transparent process, built for review." }),
    ).toBeInTheDocument();
    expect(screen.getByText("How the agent works")).toBeInTheDocument();
    expect(screen.getByText("Extracts product facts")).toBeInTheDocument();
    expect(screen.getByText("Surfaces uncertainty")).toBeInTheDocument();
  });

  it("renders the evaluation card with contract-shaped sample values", () => {
    renderMethodologyPage();
    expect(screen.getByText("Current evaluation")).toBeInTheDocument();
    expect(screen.getByText("3,200")).toBeInTheDocument();
    expect(screen.getByText("US HTS 2026 rev. 12")).toBeInTheDocument();
    expect(screen.getByText("84.1%")).toBeInTheDocument();
  });

  it("renders a chart bar for every chapter with an accessible label", () => {
    renderMethodologyPage();
    expect(screen.getByRole("img", { name: "Knitted apparel, 94 percent" })).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Plastics, 78 percent" })).toBeInTheDocument();
  });

  it("shares the same marketing nav/footer as Landing, including the mobile menu", async () => {
    const user = userEvent.setup();
    renderMethodologyPage();

    expect(screen.getByRole("link", { name: "Sign in" })).toBeInTheDocument();
    expect(screen.getByText("AI-assisted research. Human-reviewed decisions.")).toBeInTheDocument();

    await user.click(screen.getByLabelText("Open menu"));
    expect(screen.getByRole("button", { name: "Open demo workspace" })).toBeInTheDocument();
  });

  it("navigates home when the logo is clicked", async () => {
    const user = userEvent.setup();
    renderMethodologyPage();

    const [headerLogo] = screen.getAllByRole("button", { name: "HS Copilot home" });
    await user.click(headerLogo);
    expect(screen.getByText("Landing reached")).toBeInTheDocument();
  });
});
