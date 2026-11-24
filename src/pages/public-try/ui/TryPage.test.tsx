import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router";
import { SessionContext, pendingDescriptionDraft } from "@/entities/session";
import type { Session } from "@/entities/session";
import { TryPage } from "./TryPage";

const SESSION: Session = {
  userId: "user_1",
  email: "alex@company.com",
  workspaceId: "workspace_1",
};
const MAX = 1000;
const DRAFT = "Frozen shrimp, peeled, 1 kg bags";
const NEXT = "?next=%2Fapp%2Fclassify%2Fnew";

function renderTryPage(session: Session | null = null) {
  return render(
    <SessionContext.Provider value={{ session, setSession: () => {} }}>
      <MemoryRouter initialEntries={["/try"]}>
        <Routes>
          <Route path="/try" element={<TryPage />} />
          <Route path="/" element={<div>Landing reached</div>} />
          <Route path="/signup" element={<div>Sign up reached</div>} />
          <Route path="/app/classify/new" element={<div>Classify new reached</div>} />
        </Routes>
      </MemoryRouter>
    </SessionContext.Provider>,
  );
}

describe("TryPage", () => {
  beforeEach(() => window.sessionStorage.clear());
  afterEach(() => {
    vi.restoreAllMocks();
    window.sessionStorage.clear();
  });

  it("shows the saved description and leaves the draft saved", () => {
    pendingDescriptionDraft.save(DRAFT, MAX);
    renderTryPage();

    expect(screen.getByRole("heading", { level: 1, name: "See how a result looks" })).toBeVisible();
    expect(screen.getByText(DRAFT)).toBeInTheDocument();
    expect(pendingDescriptionDraft.read(MAX)).toBe(DRAFT);
  });

  it("shows a short note and a link home when there is no draft", () => {
    renderTryPage();

    expect(screen.getByText(/Describe a product to see it here\./)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("shows the note, without crashing, when sessionStorage cannot be read", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    renderTryPage();

    expect(screen.getByText(/Describe a product to see it here\./)).toBeInTheDocument();
  });

  it("shows the note when the sessionStorage property itself throws", () => {
    vi.spyOn(window, "sessionStorage", "get").mockImplementation(() => {
      throw new Error("blocked");
    });
    renderTryPage();

    expect(screen.getByText(/Describe a product to see it here\./)).toBeInTheDocument();
  });

  it("labels the static sample result and its placeholder ruling", () => {
    renderTryPage();

    expect(screen.getByRole("heading", { level: 2, name: "Sample result" })).toBeInTheDocument();
    // Heading label plus the ruling reference.
    expect(screen.getAllByText("Sample data")).toHaveLength(2);
    expect(screen.getByText("HQ 610910-26")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 3, name: "Top suggestions" })).toBeInTheDocument();
  });

  it("shows the calm disclaimer line", () => {
    renderTryPage();

    expect(
      screen.getByText(
        "This is a classification suggestion to support your decision. Confirm it with a licensed customs broker or your customs authority before you file.",
      ),
    ).toBeInTheDocument();
  });

  it("offers Create account and Sign in with only the safe next path when signed out", () => {
    pendingDescriptionDraft.save(DRAFT, MAX);
    renderTryPage();
    const main = within(screen.getByRole("main"));

    expect(main.getByRole("link", { name: "Create account" })).toHaveAttribute(
      "href",
      `/signup${NEXT}`,
    );
    expect(main.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", `/signin${NEXT}`);
    expect(main.queryByRole("link", { name: "Continue in Classify new" })).not.toBeInTheDocument();
  });

  it("offers Continue in Classify new when signed in, with no redirect", () => {
    renderTryPage(SESSION);
    const main = within(screen.getByRole("main"));

    expect(main.getByRole("link", { name: "Continue in Classify new" })).toHaveAttribute(
      "href",
      "/app/classify/new",
    );
    expect(main.queryByRole("link", { name: "Create account" })).not.toBeInTheDocument();
    expect(screen.queryByText("Classify new reached")).not.toBeInTheDocument();
  });

  it("keeps the draft saved after Create account is clicked", async () => {
    const user = userEvent.setup();
    pendingDescriptionDraft.save(DRAFT, MAX);
    renderTryPage();

    await user.click(
      within(screen.getByRole("main")).getByRole("link", { name: "Create account" }),
    );

    expect(screen.getByText("Sign up reached")).toBeInTheDocument();
    expect(pendingDescriptionDraft.read(MAX)).toBe(DRAFT);
  });

  it("keeps the draft saved after Continue in Classify new is clicked", async () => {
    const user = userEvent.setup();
    pendingDescriptionDraft.save(DRAFT, MAX);
    renderTryPage(SESSION);

    await user.click(
      within(screen.getByRole("main")).getByRole("link", { name: "Continue in Classify new" }),
    );

    expect(screen.getByText("Classify new reached")).toBeInTheDocument();
    expect(pendingDescriptionDraft.read(MAX)).toBe(DRAFT);
  });

  it.each([
    ["signed out", null],
    ["signed in", SESSION],
  ])("puts no description text in any link href (%s)", (_label, session) => {
    pendingDescriptionDraft.save(DRAFT, MAX);
    renderTryPage(session);

    const hrefs = screen.getAllByRole("link").map((link) => link.getAttribute("href") ?? "");
    for (const href of hrefs) {
      const lower = decodeURIComponent(href).toLowerCase();
      expect(lower).not.toContain("shrimp");
      expect(href).not.toContain("q=");
    }
  });
});
