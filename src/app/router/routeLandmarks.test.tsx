import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router";
import { SessionContext } from "@/entities/session";
import { ToastProvider } from "@/shared/ui/Toast";
import { appRoutes } from "./router";

vi.mock("@/widgets/app-shell/api/health.query", () => ({
  useHealthCheck: () => ({ isPending: false, isError: false, refetch: vi.fn() }),
}));

const SIGNED_IN = {
  userId: "user_1",
  email: "sam@hs-copilot.test",
  workspaceId: "workspace_1",
};

// Auth pages redirect a signed-in user to the app, so they are rendered signed out.
function renderAt(path: string, session: typeof SIGNED_IN | null = SIGNED_IN) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <SessionContext.Provider value={{ session, setSession: () => {} }}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </SessionContext.Provider>
    </QueryClientProvider>,
  );
}

const PUBLIC_PAGES = [
  ["landing", "/"],
  ["methodology", "/methodology"],
  ["pricing", "/pricing"],
  ["sample result", "/try"],
  ["privacy", "/privacy"],
  ["terms", "/terms"],
  ["not found", "/does-not-exist"],
] as const;

describe("public page landmarks", () => {
  it.each(PUBLIC_PAGES)(
    "%s has one main landmark and a skip link that targets it",
    async (_name, path) => {
      const { container } = renderAt(path);

      const skipLink = await screen.findByRole("link", { name: "Skip to main content" });
      expect(skipLink).toHaveAttribute("href", "#main-content");
      expect(screen.getAllByRole("main")).toHaveLength(1);
      expect(container.querySelector("#main-content")).toBe(screen.getByRole("main"));
    },
  );

  it("makes the skip link the first focusable element on a public page", async () => {
    const { container } = renderAt("/methodology");

    const skipLink = await screen.findByRole("link", { name: "Skip to main content" });
    const firstFocusable = container.querySelector("a[href], button");
    expect(firstFocusable).toBe(skipLink);
  });
});

describe("auth page landmarks", () => {
  it.each([
    ["/signin", "Sign in to HS Copilot"],
    ["/signup", "Start your workspace"],
    ["/reset", "Reset your password"],
  ])("%s has exactly one main landmark containing the h1", async (path, heading) => {
    renderAt(path, null);

    const main = await screen.findByRole("main");
    expect(main.querySelector("h1")).toHaveTextContent(heading);
    expect(screen.getAllByRole("main")).toHaveLength(1);
    expect(main).toHaveAttribute("id", "main-content");
    expect(main.querySelector("h1")).not.toBeNull();
  });
});

describe("app page document titles", () => {
  it.each([
    ["/app/library", "Library | HS Copilot"],
    ["/app/batches/new", "Upload batch | HS Copilot"],
    ["/app/batches/unknown-batch", "Batch review | HS Copilot"],
    ["/app/settings/general", "Settings · General | HS Copilot"],
    ["/app/settings/members", "Settings · Members | HS Copilot"],
    ["/app/settings/rules", "Settings · Review rules | HS Copilot"],
  ])("%s is titled %s", async (path, title) => {
    renderAt(path);
    await waitFor(() => expect(document.title).toBe(title));
  });

  it("titles the sample result page", async () => {
    renderAt("/try");
    await waitFor(() => expect(document.title).toBe("Sample result | HS Copilot"));
  });

  it("keeps the suffix on the classification detail fallback title", async () => {
    renderAt("/app/classifications/unknown-id");
    await waitFor(() => expect(document.title).toMatch(/ \| HS Copilot$/));
  });
});
