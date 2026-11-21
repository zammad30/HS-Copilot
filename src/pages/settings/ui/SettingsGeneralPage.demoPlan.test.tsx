import { describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { http, HttpResponse } from "msw";
import { server } from "../../../../tests/mswServer";
import { ToastProvider } from "@/shared/ui/Toast";
import { SessionContext } from "@/entities/session";
import type { Session } from "@/entities/session";
import { SettingsGeneralPage } from "./SettingsGeneralPage";

// The page reads env.useMocks; tests flip it per case without touching env files.
const envState = vi.hoisted(() => ({ useMocks: false }));
vi.mock("@/shared/config", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/config")>();
  return {
    ...actual,
    env: {
      ...actual.env,
      get useMocks() {
        return envState.useMocks;
      },
    },
  };
});

const SESSION: Session = {
  userId: "user_mock_1",
  email: "reviewer@hs-copilot.test",
  workspaceId: "workspace_mock_1",
  name: "Sam Rivera",
  workspaceName: "Sample workspace",
  role: "admin",
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider durationMs={{ default: 3000, withAction: 6000 }}>
        <SessionContext.Provider value={{ session: SESSION, setSession: () => {} }}>
          <MemoryRouter>
            <SettingsGeneralPage />
          </MemoryRouter>
        </SessionContext.Provider>
      </ToastProvider>
    </QueryClientProvider>,
  );
}

function row(label: string): HTMLElement {
  const group = screen.getByText(label, { selector: "dt" }).parentElement;
  if (!group) throw new Error(`No row for ${label}`);
  return group;
}

describe("SettingsGeneralPage - Demo plan", () => {
  it("is not rendered outside mock mode", async () => {
    envState.useMocks = false;
    renderPage();

    await screen.findByText("Audit trail kept for");
    expect(screen.queryByLabelText("Demo plan")).not.toBeInTheDocument();
    expect(screen.queryByText(/Mock mode only/)).not.toBeInTheDocument();
  });

  it("lists the plans by name with its helper text in mock mode", async () => {
    envState.useMocks = true;
    renderPage();

    const select = await screen.findByLabelText("Demo plan");
    expect(
      within(select)
        .getAllByRole("option")
        .map((option) => option.textContent),
    ).toEqual(["Free", "Solo", "Team"]);
    expect(select).toHaveValue("team");
    expect(select).toHaveAccessibleDescription(
      "Mock mode only. Switches the sample plan so you can try limits and expiry.",
    );
  });

  it("switches the plan, refreshes the plan block and shows a toast", async () => {
    envState.useMocks = true;
    const user = userEvent.setup();
    renderPage();

    const select = await screen.findByLabelText("Demo plan");
    await screen.findByText("Audit trail kept for");
    expect(within(row("Plan")).getByText("Team")).toBeInTheDocument();

    await user.selectOptions(select, "Solo");

    expect(await screen.findByText("Demo plan changed to Solo.")).toBeInTheDocument();
    expect(await within(row("Plan")).findByText("Solo")).toBeInTheDocument();
    expect(within(row("Classifications")).getByText(/of 500 per month/)).toBeInTheDocument();
    expect(within(row("Audit trail kept for")).getByText("1 year")).toBeInTheDocument();
    expect(screen.getByLabelText("Demo plan")).toHaveValue("solo");
  });

  it("shows an error toast when the switch fails", async () => {
    envState.useMocks = true;
    server.use(
      http.put("*/__mock/plan", () =>
        HttpResponse.json({ error: { code: "server_error", message: "Boom" } }, { status: 500 }),
      ),
    );
    const user = userEvent.setup();
    renderPage();

    const select = await screen.findByLabelText("Demo plan");
    await user.selectOptions(select, "Free");

    expect(
      await screen.findByText("We couldn't change the demo plan. Try again."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Demo plan changed to/)).not.toBeInTheDocument();
  });
});
