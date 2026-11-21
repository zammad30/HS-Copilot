import { describe, expect, it } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { http, HttpResponse } from "msw";
import { server } from "../../../../tests/mswServer";
import { env } from "@/shared/config";
import { PlanUsageCard } from "./PlanUsageCard";

const TEAM_LIMITS = {
  classifications: { limit: 1300, period: "month" },
  seats: 5,
  batch: { uploadsPerMonth: 10, maxRows: 500 },
  secondApprover: true,
  auditRetentionDays: 730,
};

const FREE_LIMITS = {
  classifications: { limit: 5, period: "lifetime" },
  seats: 1,
  batch: { uploadsPerMonth: 0, maxRows: 0 },
  secondApprover: false,
  auditRetentionDays: 30,
};

const SOLO_LIMITS = {
  classifications: { limit: 500, period: "month" },
  seats: 1,
  batch: { uploadsPerMonth: 3, maxRows: 50 },
  secondApprover: false,
  auditRetentionDays: 365,
};

function useWorkspaceResponse(plan: string, limits: unknown, usage: unknown) {
  server.use(
    http.get(`${env.apiBaseUrl}/workspace`, () =>
      HttpResponse.json({
        id: "workspace_mock_1",
        name: "Sample workspace",
        defaultJurisdiction: "US_HTS",
        plan,
        limits,
        usage,
      }),
    ),
  );
}

function renderCard() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PlanUsageCard />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

function row(label: string): HTMLElement {
  const term = screen.getByText(label, { selector: "dt" });
  const group = term.parentElement;
  if (!group) throw new Error(`No row for ${label}`);
  return group;
}

describe("PlanUsageCard", () => {
  it("shows the heading with a skeleton while loading, then the values", async () => {
    useWorkspaceResponse("team", TEAM_LIMITS, {
      classificationsUsed: 3,
      batchUploadsUsed: 0,
      seatsUsed: 2,
      periodEnd: "2031-11-30T12:00:00",
    });
    renderCard();

    expect(screen.getByRole("heading", { name: "Plan and usage" })).toBeInTheDocument();
    expect(screen.queryByText("Audit trail kept for")).not.toBeInTheDocument();

    expect(await screen.findByText("Audit trail kept for")).toBeInTheDocument();
  });

  it("shows the Team plan: monthly usage with a reset date, people, batch, approver, retention", async () => {
    useWorkspaceResponse("team", TEAM_LIMITS, {
      classificationsUsed: 3,
      batchUploadsUsed: 1,
      seatsUsed: 2,
      periodEnd: "2031-11-30T12:00:00",
    });
    renderCard();

    await screen.findByText("Audit trail kept for");
    expect(within(row("Plan")).getByText("Team")).toBeInTheDocument();
    const classifications = row("Classifications");
    expect(within(classifications).getByText("3 of 1,300 per month")).toBeInTheDocument();
    expect(within(classifications).getByText("Resets on Nov 30")).toBeInTheDocument();
    expect(within(row("People")).getByText("2 of 5")).toBeInTheDocument();
    expect(
      within(row("Batch uploads")).getByText("1 of 10 this month, up to 500 rows each"),
    ).toBeInTheDocument();
    expect(within(row("Second approver")).getByText("Included")).toBeInTheDocument();
    expect(within(row("Audit trail kept for")).getByText("24 months")).toBeInTheDocument();
    expect(screen.queryByText(/on on/i)).not.toBeInTheDocument();
  });

  it("reads Resets today when the period ends today", async () => {
    useWorkspaceResponse("solo", SOLO_LIMITS, {
      classificationsUsed: 10,
      batchUploadsUsed: 0,
      seatsUsed: 1,
      periodEnd: new Date().toISOString(),
    });
    renderCard();

    await screen.findByText("Audit trail kept for");
    expect(within(row("Classifications")).getByText("Resets today")).toBeInTheDocument();
    expect(screen.queryByText(/on on/i)).not.toBeInTheDocument();
  });

  it("shows the Free plan: lifetime usage with no reset date, no batch, no second approver", async () => {
    useWorkspaceResponse("free", FREE_LIMITS, {
      classificationsUsed: 3,
      batchUploadsUsed: 0,
      seatsUsed: 1,
    });
    renderCard();

    await screen.findByText("Audit trail kept for");
    expect(within(row("Plan")).getByText("Free")).toBeInTheDocument();
    const classifications = row("Classifications");
    expect(within(classifications).getByText("3 of 5 in total")).toBeInTheDocument();
    expect(within(classifications).queryByText(/Resets/)).not.toBeInTheDocument();
    expect(within(row("People")).getByText("1 of 1")).toBeInTheDocument();
    expect(within(row("Batch uploads")).getByText("Not included")).toBeInTheDocument();
    expect(within(row("Second approver")).getByText("Not included")).toBeInTheDocument();
    expect(within(row("Audit trail kept for")).getByText("30 days")).toBeInTheDocument();
  });

  it("shows the Solo plan retention as 1 year", async () => {
    useWorkspaceResponse("solo", SOLO_LIMITS, {
      classificationsUsed: 10,
      batchUploadsUsed: 0,
      seatsUsed: 1,
      periodEnd: "2031-11-30T12:00:00",
    });
    renderCard();

    await screen.findByText("Audit trail kept for");
    expect(within(row("Plan")).getByText("Solo")).toBeInTheDocument();
    expect(within(row("Audit trail kept for")).getByText("1 year")).toBeInTheDocument();
  });

  it("links to the pricing page", async () => {
    renderCard();

    const link = await screen.findByRole("link", { name: "See plans" });
    expect(link).toHaveAttribute("href", "/pricing");
  });

  it("renders no block when the workspace fails to load", async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/workspace`, () =>
        HttpResponse.json({ error: { code: "server_error", message: "Boom" } }, { status: 500 }),
      ),
    );
    renderCard();

    await waitFor(() =>
      expect(screen.queryByRole("heading", { name: "Plan and usage" })).not.toBeInTheDocument(),
    );
    expect(screen.queryByText("Classifications")).not.toBeInTheDocument();
  });

  it("hides only the Plan name row when the plan names fail to load", async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/plans`, () =>
        HttpResponse.json({ error: { code: "server_error", message: "Boom" } }, { status: 500 }),
      ),
    );
    renderCard();

    expect(await screen.findByText("Audit trail kept for")).toBeInTheDocument();
    expect(screen.getByText("Classifications")).toBeInTheDocument();
    expect(screen.queryByText("Plan", { selector: "dt" })).not.toBeInTheDocument();
  });
});
