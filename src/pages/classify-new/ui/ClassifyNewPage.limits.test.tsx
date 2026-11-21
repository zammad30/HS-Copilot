import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider } from "react-router";
import { delay, http, HttpResponse } from "msw";
import { server } from "../../../../tests/mswServer";
import { env } from "@/shared/config";
import { ClassifyNewPage } from "./ClassifyNewPage";

const MONTHLY_LIMITS = (limit: number) => ({
  classifications: { limit, period: "month" },
  seats: 5,
  batch: { uploadsPerMonth: 10, maxRows: 500 },
  secondApprover: true,
  auditRetentionDays: 730,
});

const FREE_LIMITS = {
  classifications: { limit: 5, period: "lifetime" },
  seats: 1,
  batch: { uploadsPerMonth: 0, maxRows: 0 },
  secondApprover: false,
  auditRetentionDays: 30,
};

const FAR_PERIOD_END = "2031-11-30T12:00:00";

interface WorkspaceOptions {
  plan?: string;
  limits: unknown;
  used: number;
  periodEnd?: string;
}

function workspaceBody({ plan = "team", limits, used, periodEnd }: WorkspaceOptions) {
  return {
    id: "workspace_mock_1",
    name: "Sample workspace",
    defaultJurisdiction: "US_HTS",
    plan,
    limits,
    usage: {
      classificationsUsed: used,
      batchUploadsUsed: 0,
      seatsUsed: 1,
      ...(periodEnd ? { periodEnd } : {}),
    },
  };
}

function useWorkspaceResponses(...responses: WorkspaceOptions[]) {
  let calls = 0;
  server.use(
    http.get(`${env.apiBaseUrl}/workspace`, async () => {
      const index = Math.min(calls, responses.length - 1);
      calls += 1;
      // Later fetches are slow enough for a test to observe the state before they land.
      if (index > 0) await delay(400);
      return HttpResponse.json(workspaceBody(responses[index]));
    }),
  );
  return { getCalls: () => calls };
}

function useLimitRefusal(limit: number, used: number) {
  server.use(
    http.post(`${env.apiBaseUrl}/classifications`, () =>
      HttpResponse.json(
        {
          error: {
            code: "plan_limit_reached",
            message: "This plan has reached its limit.",
            details: { reason: "classifications", limit, used },
          },
        },
        { status: 403 },
      ),
    ),
  );
}

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      { path: "/app/classify/new", Component: ClassifyNewPage },
      { path: "/app/classifications/:id", Component: () => <p>Detail</p> },
    ],
    { initialEntries: ["/app/classify/new"] },
  );
  return render(
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
}

const submitButton = () => screen.getByRole("button", { name: "Research HS codes" });

async function submitDescription(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText("Product description"), "Men's cotton T-shirt");
  await user.click(submitButton());
}

describe("ClassifyNewPage - quota line", () => {
  it("shows a monthly plan's usage with the reset date", async () => {
    useWorkspaceResponses({ limits: MONTHLY_LIMITS(1300), used: 3, periodEnd: FAR_PERIOD_END });
    renderPage();

    expect(
      await screen.findByText("3 of 1,300 classifications used this month. Resets on Nov 30."),
    ).toBeInTheDocument();
    expect(screen.queryByText(/on on/i)).not.toBeInTheDocument();
  });

  it("reads Resets today on the last day of the period", async () => {
    useWorkspaceResponses({
      limits: MONTHLY_LIMITS(500),
      used: 3,
      periodEnd: new Date().toISOString(),
    });
    renderPage();

    expect(
      await screen.findByText("3 of 500 classifications used this month. Resets today."),
    ).toBeInTheDocument();
  });

  it("shows a lifetime plan's usage in total, with no reset date", async () => {
    useWorkspaceResponses({ plan: "free", limits: FREE_LIMITS, used: 3 });
    renderPage();

    expect(await screen.findByText("3 of 5 classifications used in total.")).toBeInTheDocument();
    expect(screen.queryByText(/Resets/)).not.toBeInTheDocument();
  });

  it("does not block the form while loading", () => {
    renderPage();

    expect(screen.queryByText(/classifications used/)).not.toBeInTheDocument();
    expect(submitButton()).toBeEnabled();
  });

  it("shows nothing and keeps the form usable when the workspace fails", async () => {
    let calls = 0;
    server.use(
      http.get(`${env.apiBaseUrl}/workspace`, () => {
        calls += 1;
        return HttpResponse.json(
          { error: { code: "server_error", message: "Boom" } },
          { status: 500 },
        );
      }),
    );
    renderPage();

    await waitFor(() => expect(calls).toBeGreaterThanOrEqual(1));
    await waitFor(() => expect(screen.queryByText(/classifications used/)).not.toBeInTheDocument());
    expect(submitButton()).toBeEnabled();
  });

  it("updates after a classification is created", async () => {
    const user = userEvent.setup();
    renderPage();

    expect(
      await screen.findByText(/^3 of 1,300 classifications used this month\./),
    ).toBeInTheDocument();
    await submitDescription(user);

    expect(
      await screen.findByText(/^4 of 1,300 classifications used this month\./, undefined, {
        timeout: 5000,
      }),
    ).toBeInTheDocument();
  });
});

describe("ClassifyNewPage - limit reached", () => {
  it("shows no banner and an enabled submit under the limit", async () => {
    useWorkspaceResponses({ limits: MONTHLY_LIMITS(1300), used: 3, periodEnd: FAR_PERIOD_END });
    renderPage();

    await screen.findByText(/classifications used this month/);
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "See plans" })).not.toBeInTheDocument();
    expect(submitButton()).toBeEnabled();
  });

  it("shows the banner, a pricing link and a disabled submit tied to it on a lifetime plan", async () => {
    useWorkspaceResponses({ plan: "free", limits: FREE_LIMITS, used: 5 });
    renderPage();

    const banner = await screen.findByRole("status");
    expect(banner).toHaveTextContent("You have used all 5 classifications in your plan.");
    expect(banner).not.toHaveTextContent(/resets/i);
    expect(screen.getByRole("link", { name: "See plans" })).toHaveAttribute("href", "/pricing");
    expect(screen.queryByRole("button", { name: "Dismiss" })).not.toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
    expect(submitButton()).toHaveAttribute("aria-describedby", banner.id);
  });

  it("adds the reset date for a monthly plan, with a single 'on'", async () => {
    useWorkspaceResponses({ limits: MONTHLY_LIMITS(1300), used: 1300, periodEnd: FAR_PERIOD_END });
    renderPage();

    const banner = await screen.findByRole("status");
    expect(banner).toHaveTextContent(
      "You have used all 1,300 classifications in your plan. Your limit resets on Nov 30.",
    );
    expect(banner).not.toHaveTextContent(/on on/i);
  });

  it("says the limit resets today on the last day of the period", async () => {
    useWorkspaceResponses({
      limits: MONTHLY_LIMITS(500),
      used: 500,
      periodEnd: new Date().toISOString(),
    });
    renderPage();

    expect(await screen.findByRole("status")).toHaveTextContent(
      "You have used all 500 classifications in your plan. Your limit resets today.",
    );
  });
});

describe("ClassifyNewPage - stale usage refused by the server", () => {
  it("shows the banner from the 403 instead of the generic error, and refetches the workspace", async () => {
    const { getCalls } = useWorkspaceResponses(
      { limits: MONTHLY_LIMITS(1300), used: 3, periodEnd: FAR_PERIOD_END },
      { limits: MONTHLY_LIMITS(1300), used: 3, periodEnd: FAR_PERIOD_END },
    );
    useLimitRefusal(1300, 1300);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText(/classifications used this month/);
    await submitDescription(user);

    expect(await screen.findByRole("status")).toHaveTextContent(
      "You have used all 1,300 classifications in your plan.",
    );
    expect(
      screen.queryByText("We couldn't start the research. Try again."),
    ).not.toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
    await waitFor(() => expect(getCalls()).toBe(2));
  });

  it("clears the banner and re-enables submit when the refetched workspace is under the limit", async () => {
    useWorkspaceResponses(
      { limits: MONTHLY_LIMITS(1300), used: 3, periodEnd: FAR_PERIOD_END },
      { limits: MONTHLY_LIMITS(1300), used: 3, periodEnd: FAR_PERIOD_END },
    );
    useLimitRefusal(1300, 1300);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText(/classifications used this month/);
    await submitDescription(user);
    await screen.findByRole("status");

    await waitFor(() => expect(screen.queryByRole("status")).not.toBeInTheDocument());
    expect(submitButton()).toBeEnabled();
    expect(submitButton()).not.toHaveAttribute("aria-describedby");
    expect(
      screen.queryByText("We couldn't start the research. Try again."),
    ).not.toBeInTheDocument();
  });

  it("keeps the banner, driven by the workspace, when the refetched workspace is at the limit", async () => {
    const { getCalls } = useWorkspaceResponses(
      { limits: MONTHLY_LIMITS(1300), used: 3, periodEnd: FAR_PERIOD_END },
      { plan: "solo", limits: MONTHLY_LIMITS(500), used: 500, periodEnd: FAR_PERIOD_END },
    );
    useLimitRefusal(1300, 1300);
    const user = userEvent.setup();
    renderPage();

    await screen.findByText(/classifications used this month/);
    await submitDescription(user);
    await screen.findByText(/all 1,300 classifications/);

    // Once the refetch lands the banner reads from the workspace (500), not the 403 (1,300).
    expect(await screen.findByText(/all 500 classifications/)).toBeInTheDocument();
    expect(getCalls()).toBe(2);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(submitButton()).toBeDisabled();
  });
});
