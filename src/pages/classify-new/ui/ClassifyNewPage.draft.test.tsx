import { StrictMode } from "react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router";
import { SessionContext, pendingDescriptionDraft } from "@/entities/session";
import type { Session } from "@/entities/session";
import { ClassifyNewPage } from "./ClassifyNewPage";

const SESSION: Session = {
  userId: "user_1",
  email: "alex@company.com",
  workspaceId: "workspace_1",
};
const MAX = 1000;
const STORAGE_KEY = "hs-copilot:pending-description";

function renderPage(
  initialEntry = "/app/classify/new",
  { session = SESSION, strict = false }: { session?: Session | null; strict?: boolean } = {},
) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter([{ path: "/app/classify/new", Component: ClassifyNewPage }], {
    initialEntries: [initialEntry],
  });
  const tree = (
    <QueryClientProvider client={queryClient}>
      <SessionContext.Provider value={{ session, setSession: () => {} }}>
        <RouterProvider router={router} />
      </SessionContext.Provider>
    </QueryClientProvider>
  );
  return render(strict ? <StrictMode>{tree}</StrictMode> : tree);
}

describe("ClassifyNewPage - saved draft", () => {
  beforeEach(() => window.sessionStorage.clear());
  afterEach(() => window.sessionStorage.clear());

  it("prefills an empty description from the draft and clears the draft", () => {
    pendingDescriptionDraft.save("Frozen shrimp, peeled, 1 kg bags", MAX);
    renderPage();

    expect(screen.getByLabelText("Product description")).toHaveValue(
      "Frozen shrimp, peeled, 1 kg bags",
    );
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("leaves the Destination default alone", () => {
    pendingDescriptionDraft.save("Frozen shrimp", MAX);
    renderPage();

    expect(screen.getByLabelText("Destination")).toHaveValue("US_HTS");
  });

  it("uses ?q= over the draft and keeps the draft for later", () => {
    pendingDescriptionDraft.save("Draft text", MAX);
    renderPage("/app/classify/new?q=Wireless%20earbuds");

    expect(screen.getByLabelText("Product description")).toHaveValue("Wireless earbuds");
    expect(pendingDescriptionDraft.read(MAX)).toBe("Draft text");
  });

  it("does nothing when there is no draft", () => {
    renderPage();

    expect(screen.getByLabelText("Product description")).toHaveValue("");
  });

  it("does nothing, and keeps the draft, when nobody is signed in", () => {
    pendingDescriptionDraft.save("Draft text", MAX);
    renderPage("/app/classify/new", { session: null });

    expect(screen.getByLabelText("Product description")).toHaveValue("");
    expect(pendingDescriptionDraft.read(MAX)).toBe("Draft text");
  });

  it("ignores and clears an expired draft", () => {
    const thirtyOneMinutesAgo = Date.now() - 31 * 60 * 1000;
    pendingDescriptionDraft.save("Stale text", MAX, thirtyOneMinutesAgo);
    renderPage();

    expect(screen.getByLabelText("Product description")).toHaveValue("");
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("ignores and clears a corrupt draft", () => {
    window.sessionStorage.setItem(STORAGE_KEY, "{not json");
    renderPage();

    expect(screen.getByLabelText("Product description")).toHaveValue("");
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it("shows the draft on the first render and keeps it through StrictMode's double effect", () => {
    pendingDescriptionDraft.save("Frozen shrimp", MAX);
    renderPage("/app/classify/new", { strict: true });

    expect(screen.getByLabelText("Product description")).toHaveValue("Frozen shrimp");
    expect(window.sessionStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
