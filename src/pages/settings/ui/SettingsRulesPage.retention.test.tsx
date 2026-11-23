import { useState } from "react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { delay, http as mswHttp, HttpResponse } from "msw";
import { server } from "../../../../tests/mswServer";
import { env } from "@/shared/config";
import { http } from "@/shared/api";
import { ToastProvider } from "@/shared/ui/Toast";
import { SessionContext } from "@/entities/session";
import type { Session } from "@/entities/session";
import { SettingsRulesPage } from "./SettingsRulesPage";

const ADMIN_SESSION: Session = {
  userId: "user_mock_1",
  email: "reviewer@hs-copilot.test",
  workspaceId: "workspace_mock_1",
  name: "Sam Rivera",
  workspaceName: "Sample workspace",
  role: "admin",
};

function renderPage() {
  function TestSessionProvider({ children }: { children: ReactNode }) {
    const [current, setSession] = useState<Session | null>(ADMIN_SESSION);
    return (
      <SessionContext.Provider value={{ session: current, setSession }}>
        {children}
      </SessionContext.Provider>
    );
  }

  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <TestSessionProvider>
          <MemoryRouter>
            <SettingsRulesPage />
          </MemoryRouter>
        </TestSessionProvider>
      </ToastProvider>
    </QueryClientProvider>,
  );
  return queryClient;
}

const sentence = (days: string) =>
  `Records are kept for ${days} days on your plan. After that they are removed from your workspace.`;

describe("SettingsRulesPage - retention text", () => {
  it.each([
    ["free", "30"],
    ["solo", "365"],
    ["team", "730"],
  ])("shows the retention in days on the %s plan", async (plan, days) => {
    await http.put("/__mock/plan", { plan });
    renderPage();

    const text = await screen.findByText((_, element) =>
      Boolean(element?.tagName === "P" && element.textContent?.startsWith(sentence(days))),
    );
    expect(text).toBeInTheDocument();
  });

  it("links to the pricing page with See plans", async () => {
    renderPage();

    const paragraph = await screen.findByText((_, element) =>
      Boolean(element?.tagName === "P" && element.textContent?.startsWith("Records are kept for")),
    );
    const link = within(paragraph).getByRole("link", { name: "See plans" });
    expect(link).toHaveAttribute("href", "/pricing");
  });

  it("is plain text: no form control is labelled with it", async () => {
    renderPage();
    await screen.findByText(/Records are kept for/);

    expect(screen.queryByLabelText(/retention|records are kept/i)).not.toBeInTheDocument();
  });

  it("shows a skeleton while the workspace loads, then the text", async () => {
    server.use(
      mswHttp.get(`${env.apiBaseUrl}/workspace`, async () => {
        await delay(600);
        return HttpResponse.json({
          id: "workspace_mock_1",
          name: "Sample workspace",
          defaultJurisdiction: "US_HTS",
          plan: "team",
          limits: {
            classifications: { limit: 1300, period: "month" },
            seats: 5,
            batch: { uploadsPerMonth: 10, maxRows: 500 },
            secondApprover: true,
            auditRetentionDays: 730,
          },
          usage: { classificationsUsed: 0, batchUploadsUsed: 0, seatsUsed: 1 },
        });
      }),
    );
    renderPage();

    expect(screen.queryByText(/Records are kept for/)).not.toBeInTheDocument();
    expect(await screen.findByText(/Records are kept for 730 days/)).toBeInTheDocument();
  });

  it("shows nothing for this block when the workspace fails to load", async () => {
    server.use(
      mswHttp.get(`${env.apiBaseUrl}/workspace`, () =>
        HttpResponse.json({ error: { code: "server_error", message: "Boom" } }, { status: 500 }),
      ),
    );
    const queryClient = renderPage();

    await screen.findByLabelText("Highlight for approval above (%)");
    await waitFor(() =>
      expect(
        queryClient
          .getQueryCache()
          .findAll()
          .some((query) => query.state.status === "error"),
      ).toBe(true),
    );
    expect(screen.queryByText(/Records are kept for/)).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "See plans" })).not.toBeInTheDocument();
  });
});
