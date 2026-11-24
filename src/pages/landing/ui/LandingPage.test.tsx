import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes, useLocation } from "react-router";
import { pendingDescriptionDraft } from "@/entities/session";
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

function TryProbe() {
  const location = useLocation();
  return (
    <div>
      Try reached path={location.pathname} search=[{location.search}] state=
      {JSON.stringify(location.state)}
    </div>
  );
}

function renderWithTryProbe() {
  return render(
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/try" element={<TryProbe />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe("LandingPage - saved draft", () => {
  const MAX = 1000;

  beforeEach(() => window.sessionStorage.clear());
  afterEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
  });

  it("saves the trimmed text and goes to /try with no query string or state", async () => {
    const user = userEvent.setup();
    renderWithTryProbe();

    const input = screen.getByLabelText("Try one product");
    await user.clear(input);
    await user.type(input, "  A wool scarf  ");
    await user.click(screen.getByRole("button", { name: "Classify" }));

    expect(screen.getByText(/Try reached path=\/try search=\[\] state=null/)).toBeInTheDocument();
    expect(pendingDescriptionDraft.read(MAX)).toBe("A wool scarf");
  });

  it("keeps the 200 character cap on the saved text", async () => {
    const user = userEvent.setup();
    renderWithTryProbe();

    const input = screen.getByLabelText("Try one product");
    await user.clear(input);
    await user.click(input);
    await user.paste("a".repeat(250));
    await user.click(screen.getByRole("button", { name: "Classify" }));

    expect(pendingDescriptionDraft.read(MAX)).toBe("a".repeat(200));
  });

  it.each([
    ["empty", ""],
    ["whitespace-only", "   "],
  ])("shows the inline error and saves nothing when the text is %s", async (_label, value) => {
    const user = userEvent.setup();
    renderWithTryProbe();

    const input = screen.getByLabelText("Try one product");
    await user.clear(input);
    if (value) await user.type(input, value);
    await user.click(screen.getByRole("button", { name: "Classify" }));

    expect(screen.getByText("Enter a product description.")).toBeInTheDocument();
    expect(screen.queryByText(/Try reached/)).not.toBeInTheDocument();
    expect(pendingDescriptionDraft.read(MAX)).toBeUndefined();
  });

  it("still goes to /try when sessionStorage throws on save", async () => {
    const user = userEvent.setup();
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    renderWithTryProbe();

    await user.click(screen.getByRole("button", { name: "Classify" }));

    expect(screen.getByText(/Try reached path=\/try search=\[\]/)).toBeInTheDocument();
  });

  it("still goes to /try when the sessionStorage property itself throws", async () => {
    const user = userEvent.setup();
    vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => {
      throw new Error("blocked");
    });
    renderWithTryProbe();

    await user.click(screen.getByRole("button", { name: "Classify" }));

    expect(screen.getByText(/Try reached path=\/try search=\[\]/)).toBeInTheDocument();
  });

  it("hands the saved text on for Classify new to prefill", async () => {
    const user = userEvent.setup();
    renderWithTryProbe();

    const input = screen.getByLabelText("Try one product");
    await user.clear(input);
    await user.type(input, "Frozen shrimp, peeled, 1 kg bags");
    await user.click(screen.getByRole("button", { name: "Classify" }));

    // Classify new reads the draft with exactly this call (see ClassifyNewPage.draft.test.tsx
    // for the prefill itself). Importing that page here would be a sideways page import.
    expect(pendingDescriptionDraft.read(MAX)).toBe("Frozen shrimp, peeled, 1 kg bags");
  });
});
