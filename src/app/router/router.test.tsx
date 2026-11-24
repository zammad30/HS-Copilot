import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router";
import { SessionContext } from "@/entities/session";
import { ToastProvider } from "@/shared/ui/Toast";
import { appRoutes } from "./router";

const RENDER_FAILURE = "SECRET render failure in the home page";
const CHUNK_FAILURE = "SECRET chunk failure for the library page";
const PRICING_FAILURE = "SECRET render failure in the pricing page";

vi.mock("@/pages/home", () => ({
  HomePage: () => {
    throw new Error("SECRET render failure in the home page");
  },
}));
// A factory that throws makes the dynamic import reject, like a chunk that fails to load.
vi.mock("@/pages/library", () => {
  throw new Error("SECRET chunk failure for the library page");
});
vi.mock("@/pages/pricing", () => ({
  PricingPage: () => {
    throw new Error("SECRET render failure in the pricing page");
  },
}));
vi.mock("@/widgets/app-shell/api/health.query", () => ({
  useHealthCheck: () => ({ isPending: false, isError: false, refetch: vi.fn() }),
}));

afterEach(() => vi.unstubAllGlobals());

function renderAt(path: string) {
  const router = createMemoryRouter(appRoutes, { initialEntries: [path] });
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <SessionContext.Provider
        value={{
          session: { userId: "user_1", email: "sam@hs-copilot.test", workspaceId: "workspace_1" },
          setSession: () => {},
        }}
      >
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </SessionContext.Provider>
    </QueryClientProvider>,
  );
}

// React and the router log a thrown render to the console; that noise is expected here only.
function silenceConsoleError() {
  return vi.spyOn(console, "error").mockImplementation(() => {});
}

describe("app routes", () => {
  it("shows the error screen inside the app shell when a page throws, with no error text", async () => {
    const consoleError = silenceConsoleError();
    try {
      renderAt("/app");

      const heading = await screen.findByRole("heading", {
        level: 1,
        name: "Something went wrong",
      });
      expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
      expect(heading).toHaveFocus();
      expect(screen.getByRole("link", { name: "Go to home" })).toHaveAttribute("href", "/app");
      expect(screen.queryByText(new RegExp(RENDER_FAILURE))).not.toBeInTheDocument();
      expect(screen.queryByText(/SECRET/)).not.toBeInTheDocument();
    } finally {
      consoleError.mockRestore();
    }
  });

  it("reloads from the in-shell error screen", async () => {
    const user = userEvent.setup();
    const consoleError = silenceConsoleError();
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });
    try {
      renderAt("/app");

      await user.click(await screen.findByRole("button", { name: "Reload page" }));

      expect(reload).toHaveBeenCalledTimes(1);
    } finally {
      consoleError.mockRestore();
    }
  });

  it("shows the same error screen when a lazy route fails to load", async () => {
    const user = userEvent.setup();
    const consoleError = silenceConsoleError();
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });
    try {
      renderAt("/app/library");

      expect(
        await screen.findByRole("heading", { level: 1, name: "Something went wrong" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
      expect(screen.queryByText(new RegExp(CHUNK_FAILURE))).not.toBeInTheDocument();
      expect(screen.queryByText(/SECRET/)).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Reload page" }));
      expect(reload).toHaveBeenCalledTimes(1);
    } finally {
      consoleError.mockRestore();
    }
  });

  it("shows a full-page error pointing to the landing page when a public page throws", async () => {
    const consoleError = silenceConsoleError();
    try {
      renderAt("/pricing");

      expect(
        await screen.findByRole("heading", { level: 1, name: "Something went wrong" }),
      ).toBeInTheDocument();
      expect(screen.queryByRole("navigation", { name: "Primary" })).not.toBeInTheDocument();
      expect(screen.getByRole("link", { name: "Go to home" })).toHaveAttribute("href", "/");
      expect(screen.queryByText(new RegExp(PRICING_FAILURE))).not.toBeInTheDocument();
    } finally {
      consoleError.mockRestore();
    }
  });

  it("shows the not-found screen inside the app shell for an unknown /app URL", async () => {
    renderAt("/app/does-not-exist");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Primary" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back to home" })).toHaveAttribute("href", "/app");
    expect(document.title).toBe("Page not found | HS Copilot");
  });

  it("shows the public not-found page, without the app shell, for an unknown public URL", async () => {
    renderAt("/does-not-exist");

    expect(
      await screen.findByRole("heading", { level: 1, name: "Page not found" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("navigation", { name: "Primary" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Back home" })).toHaveAttribute("href", "/");
  });
});
