import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router";
import { SessionContext } from "@/entities/session";
import type { Session } from "@/entities/session";
import { http } from "@/shared/api";
import { ToastProvider } from "@/shared/ui/Toast";
import { PricingPage } from "./PricingPage";

const SIGNED_IN_SESSION: Session = {
  userId: "user_test_1",
  email: "reviewer@example.test",
  workspaceId: "workspace_test_1",
};

function renderPage({ session = null }: { session?: Session | null } = {}) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <SessionContext.Provider value={{ session, setSession: () => {} }}>
        <ToastProvider>
          <MemoryRouter initialEntries={["/pricing"]}>
            <Routes>
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/signup" element={<div>Sign-up reached</div>} />
            </Routes>
          </MemoryRouter>
        </ToastProvider>
      </SessionContext.Provider>
    </QueryClientProvider>,
  );
}

const WAIT = { timeout: 3000 };

function pathOf(input: RequestInfo | URL): string {
  const url = input instanceof Request ? input.url : String(input);
  return new URL(url, "http://localhost").pathname;
}

// Layers below app cannot import the MSW server (Steiger), so a test that needs
// a different answer wraps fetch and lets every other request fall through to MSW.
// Every request is recorded so a test can count calls to a path.
function stubResponse(path: string, makeResponse: (callCount: number) => Response | null) {
  const originalFetch = globalThis.fetch;
  const requestedPaths: string[] = [];
  let callCount = 0;
  vi.spyOn(globalThis, "fetch").mockImplementation((input, init) => {
    const requestPath = pathOf(input);
    requestedPaths.push(requestPath);
    if (requestPath.endsWith(path)) {
      callCount += 1;
      const response = makeResponse(callCount);
      if (response) return Promise.resolve(response);
    }
    return originalFetch(input, init);
  });
  return {
    countRequests: (target: string) => requestedPaths.filter((p) => p.endsWith(target)).length,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

const CUSTOM_PLANS = {
  items: [
    {
      id: "free",
      name: "Free",
      priceMonthlyCents: 0,
      limits: {
        classifications: { limit: 7, period: "lifetime" },
        seats: 1,
        batch: { uploadsPerMonth: 0, maxRows: 0 },
        secondApprover: false,
        auditRetentionDays: 14,
      },
      isSample: true,
    },
    {
      id: "solo",
      name: "Solo",
      priceMonthlyCents: 1999,
      limits: {
        classifications: { limit: 250, period: "month" },
        seats: 2,
        batch: { uploadsPerMonth: 4, maxRows: 75 },
        secondApprover: false,
        auditRetentionDays: 365,
      },
      isSample: true,
    },
    {
      id: "team",
      name: "Team",
      priceMonthlyCents: 4999,
      limits: {
        classifications: { limit: 2000, period: "month" },
        seats: 9,
        batch: { uploadsPerMonth: 20, maxRows: 800 },
        secondApprover: true,
        auditRetentionDays: 1095,
      },
      isSample: true,
    },
  ],
};

describe("PricingPage", () => {
  it("renders the three plans from the mock as cards", async () => {
    renderPage();
    const free = await screen.findByRole("region", { name: "Free" }, WAIT);
    const solo = screen.getByRole("region", { name: "Solo" });
    const team = screen.getByRole("region", { name: "Team" });

    expect(within(free).getByText("To try the product")).toBeInTheDocument();
    expect(within(solo).getByText("For one reviewer")).toBeInTheDocument();
    expect(within(team).getByText("For a small team")).toBeInTheDocument();
    expect(within(free).getByText("$0")).toBeInTheDocument();
    expect(within(free).getByText("5 classifications in total")).toBeInTheDocument();
    expect(within(free).getByText("1 person")).toBeInTheDocument();
    expect(within(free).getByText("No batch upload")).toBeInTheDocument();
    expect(within(solo).getByText("$14.99")).toBeInTheDocument();
    expect(
      within(solo).getByText("3 batch uploads per month, up to 50 rows each"),
    ).toBeInTheDocument();
    expect(within(team).getByText("$29.99")).toBeInTheDocument();
    expect(within(team).getByText("Audit trail kept for 24 months")).toBeInTheDocument();
    expect(within(team).getByText("Up to 5 people")).toBeInTheDocument();
    expect(within(team).getByText("API access (planned)")).toBeInTheDocument();
    expect(screen.getAllByText("per month", { selector: "span" })).toHaveLength(3);
  });

  it("formats every figure from the data it receives", async () => {
    stubResponse("/plans", () => Response.json(CUSTOM_PLANS));
    renderPage();
    const free = await screen.findByRole("region", { name: "Free" }, WAIT);
    const solo = screen.getByRole("region", { name: "Solo" });
    const team = screen.getByRole("region", { name: "Team" });

    expect(within(solo).getByText("$19.99")).toBeInTheDocument();
    expect(within(team).getByText("$49.99")).toBeInTheDocument();
    expect(within(free).getByText("7 classifications in total")).toBeInTheDocument();
    expect(within(team).getByText("2,000 classifications per month")).toBeInTheDocument();
    expect(within(free).getByText("Audit trail kept for 14 days")).toBeInTheDocument();
    expect(within(team).getByText("Audit trail kept for 36 months")).toBeInTheDocument();
    expect(within(team).getByText("Up to 9 people")).toBeInTheDocument();
    expect(screen.queryByText("$14.99")).not.toBeInTheDocument();
  });

  it("marks included and not included features with hidden text, not only icons", async () => {
    renderPage();
    const free = await screen.findByRole("region", { name: "Free" }, WAIT);
    const team = screen.getByRole("region", { name: "Team" });

    expect(within(free).getByText("No batch upload").closest("li")).toHaveTextContent(
      "Not included:",
    );
    expect(
      within(free)
        .getByText(/Audit trail kept for/)
        .closest("li"),
    ).toHaveTextContent("Included:");
    expect(within(team).getByText("Second approver").closest("li")).toHaveTextContent("Included:");
    expect(within(free).getByText("Second approver").closest("li")).toHaveTextContent(
      "Not included:",
    );
    expect(within(team).getByText("API access (planned)").closest("li")).toHaveTextContent(
      "Not included:",
    );
    expect(within(free).getAllByRole("listitem")).toHaveLength(6);
  });

  it("shows a loading skeleton until the plans arrive", async () => {
    renderPage();

    expect(screen.getByLabelText("Loading plans")).toHaveAttribute("aria-busy", "true");
    expect(screen.queryByRole("region", { name: "Free" })).not.toBeInTheDocument();

    await screen.findByRole("region", { name: "Free" }, WAIT);
    expect(screen.queryByLabelText("Loading plans")).not.toBeInTheDocument();
  });

  it("shows an error and recovers with Try again", async () => {
    const user = userEvent.setup();
    stubResponse("/plans", (callCount) =>
      callCount === 1
        ? Response.json({ error: { code: "server_error", message: "Boom" } }, { status: 500 })
        : null,
    );
    renderPage();

    expect(await screen.findByText("We couldn't load plans", undefined, WAIT)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Try again" }));

    expect(await screen.findByRole("region", { name: "Free" }, WAIT)).toBeInTheDocument();
  });

  it("signed out: three Get started buttons go to sign-up and GET /workspace is never called", async () => {
    const user = userEvent.setup();
    const { countRequests } = stubResponse("/workspace", () => null);
    renderPage();
    await screen.findByRole("region", { name: "Free" }, WAIT);

    expect(screen.getAllByRole("button", { name: "Get started" })).toHaveLength(3);
    expect(screen.queryByText("Current plan")).not.toBeInTheDocument();

    await user.click(
      within(screen.getByRole("region", { name: "Solo" })).getByRole("button", {
        name: "Get started",
      }),
    );
    expect(screen.getByText("Sign-up reached")).toBeInTheDocument();
    expect(countRequests("/plans")).toBeGreaterThan(0);
    expect(countRequests("/workspace")).toBe(0);
  });

  it("signed in on Team: Team shows a non-interactive Current plan box, Solo and Free show Downgrade plan", async () => {
    renderPage({ session: SIGNED_IN_SESSION });
    const team = await screen.findByRole("region", { name: "Team" }, WAIT);

    const current = await within(team).findByText("Current plan", undefined, WAIT);
    expect(current).toBeInTheDocument();
    expect(within(team).queryByRole("button")).not.toBeInTheDocument();
    for (const name of ["Free", "Solo"]) {
      const card = screen.getByRole("region", { name });
      expect(within(card).getByRole("button", { name: "Downgrade plan" })).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "Get started" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Upgrade plan" })).not.toBeInTheDocument();
    expect(screen.getAllByText("Current plan")).toHaveLength(1);
  });

  it("signed in on Free: Solo and Team show Upgrade plan", async () => {
    await http.put("/__mock/plan", { plan: "free" });
    renderPage({ session: SIGNED_IN_SESSION });
    const free = await screen.findByRole("region", { name: "Free" }, WAIT);

    expect(await within(free).findByText("Current plan", undefined, WAIT)).toBeInTheDocument();
    for (const name of ["Solo", "Team"]) {
      const card = screen.getByRole("region", { name });
      expect(within(card).getByRole("button", { name: "Upgrade plan" })).toBeInTheDocument();
    }
    expect(screen.queryByRole("button", { name: "Downgrade plan" })).not.toBeInTheDocument();
  });

  it("clicking Upgrade plan shows an info toast and does not navigate", async () => {
    const user = userEvent.setup();
    await http.put("/__mock/plan", { plan: "free" });
    renderPage({ session: SIGNED_IN_SESSION });
    const solo = await screen.findByRole("region", { name: "Solo" }, WAIT);

    await user.click(await within(solo).findByRole("button", { name: "Upgrade plan" }, WAIT));

    expect(screen.getByText("Plan changes are not available in this demo.")).toBeInTheDocument();
    expect(screen.queryByText("Sign-up reached")).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Solo" })).toBeInTheDocument();
  });

  it("puts the action area after the feature list in each card", async () => {
    renderPage();
    const free = await screen.findByRole("region", { name: "Free" }, WAIT);

    const list = within(free).getByRole("list");
    const button = within(free).getByRole("button", { name: "Get started" });
    expect(list.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("signed in: the button area is empty and a muted line shows when the workspace fails", async () => {
    stubResponse("/workspace", () =>
      Response.json({ error: { code: "server_error", message: "Boom" } }, { status: 500 }),
    );
    renderPage({ session: SIGNED_IN_SESSION });

    expect(
      await screen.findByText("We could not load your current plan.", undefined, WAIT),
    ).toBeInTheDocument();
    expect(await screen.findByRole("region", { name: "Team" }, WAIT)).toBeInTheDocument();
    expect(screen.queryByText("Current plan")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Changing plans is not available in this demo."),
    ).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Get started" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /plan$/ })).not.toBeInTheDocument();
  });

  it("shows the sample label, the demo line and the three notes", async () => {
    renderPage();
    await screen.findByRole("region", { name: "Free" }, WAIT);

    expect(screen.getByText("Sample data")).toBeInTheDocument();
    expect(screen.getByText("This is a demo. No payments are taken.")).toBeInTheDocument();
    const batchNote = screen.getByText(/^Batch rows count/);
    expect(batchNote.tagName).toBe("P");
    expect(batchNote.closest("li")).toBeNull();
    expect(screen.getByText(/deleted after the retention period/)).toBeInTheDocument();
    expect(screen.getByText("Everyone who uses the product needs an account.")).toBeInTheDocument();
  });

  it("sets the document title", async () => {
    renderPage();
    await screen.findByRole("region", { name: "Free" }, WAIT);
    expect(document.title).toBe("Pricing | HS Copilot");
  });
});
