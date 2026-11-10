import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { LandingPage } from "./LandingPage";

function renderLandingPage() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/try" element={<div>Try page reached</div>} />
        <Route path="/app" element={<div>App reached</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("LandingPage", () => {
  it("renders the hero, how-it-works, accuracy and FAQ sections", () => {
    renderLandingPage();
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Classify with evidence.Decide with confidence.",
    );
    expect(screen.getByText("From product detail to a reviewable decision")).toBeInTheDocument();
    expect(screen.getByText("Accuracy you can inspect")).toBeInTheDocument();
    expect(screen.getByText("92.4%")).toBeInTheDocument();
    expect(screen.getByText("Is a suggested code final?")).toBeInTheDocument();
  });

  it("shows an inline error and does not navigate when the try-box is submitted empty", async () => {
    const user = userEvent.setup();
    renderLandingPage();

    const input = screen.getByLabelText("Try one product");
    await user.clear(input);
    await user.click(screen.getByRole("button", { name: "Classify" }));

    expect(screen.getByText("Enter a product description.")).toBeInTheDocument();
    expect(screen.queryByText("Try page reached")).not.toBeInTheDocument();
  });

  it("navigates to /try with the trimmed text when the try-box is submitted", async () => {
    const user = userEvent.setup();
    renderLandingPage();

    const input = screen.getByLabelText("Try one product");
    await user.clear(input);
    await user.type(input, "  A wool scarf  ");
    await user.click(screen.getByRole("button", { name: "Classify" }));

    expect(screen.getByText("Try page reached")).toBeInTheDocument();
  });

  it('navigates to /app when "Open demo" is clicked', async () => {
    const user = userEvent.setup();
    renderLandingPage();

    await user.click(screen.getByRole("button", { name: "Open demo" }));

    expect(screen.getByText("App reached")).toBeInTheDocument();
  });

  it("expands a FAQ item to reveal its answer", async () => {
    const user = userEvent.setup();
    renderLandingPage();

    const summary = screen.getByText("Does this replace a customs broker?");
    await user.click(summary);

    expect(
      screen.getByText(
        "No. HS Copilot organizes research and evidence; your qualified team owns the decision.",
      ),
    ).toBeVisible();
  });
});
