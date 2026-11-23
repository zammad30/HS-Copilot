import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router";
import { delay, http as mswHttp, HttpResponse } from "msw";
import { server } from "../../../../tests/mswServer";
import { env } from "@/shared/config";
import { http } from "@/shared/api";
import { ExpiringBanner } from "./ExpiringBanner";

function renderBanner() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <ExpiringBanner />
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return queryClient;
}

async function settled(queryClient: QueryClient) {
  await waitFor(() => expect(queryClient.isFetching()).toBe(0));
}

function useExpiringTotal(total: number) {
  server.use(
    mswHttp.get(`${env.apiBaseUrl}/classifications`, () =>
      HttpResponse.json({ items: [], total, page: 1, pageSize: 1 }),
    ),
  );
}

describe("ExpiringBanner", () => {
  it("shows nothing when no record is expiring (Team)", async () => {
    const queryClient = renderBanner();
    // Team is the mock default; its expiring total is 0.
    await settled(queryClient);
    await waitFor(() => expect(queryClient.getQueryCache().findAll()).toHaveLength(2));
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows the singular copy and a link to the filtered Library on Free", async () => {
    await http.put("/__mock/plan", { plan: "free" });
    renderBanner();

    expect(await screen.findByText(/1 record will expire within 10 days\./)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Show them" })).toHaveAttribute(
      "href",
      "/app/library?expiring=true",
    );
  });

  it("uses the 30 day window on Solo", async () => {
    await http.put("/__mock/plan", { plan: "solo" });
    renderBanner();

    expect(await screen.findByText(/1 record will expire within 30 days\./)).toBeInTheDocument();
  });

  it("uses the plural for more than one record", async () => {
    useExpiringTotal(2);
    renderBanner();

    expect(await screen.findByText(/2 records will expire within 30 days\./)).toBeInTheDocument();
  });

  it("is not dismissible", async () => {
    useExpiringTotal(2);
    renderBanner();

    await screen.findByText(/2 records will expire/);
    expect(screen.queryByRole("button", { name: "Dismiss" })).not.toBeInTheDocument();
  });

  it("shows nothing while the counts are loading", () => {
    server.use(
      mswHttp.get(`${env.apiBaseUrl}/classifications`, async () => {
        await delay("infinite");
        return HttpResponse.json({});
      }),
    );
    renderBanner();

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("shows nothing when the count request fails", async () => {
    server.use(
      mswHttp.get(`${env.apiBaseUrl}/classifications`, () =>
        HttpResponse.json({ error: { code: "server_error", message: "Boom" } }, { status: 500 }),
      ),
    );
    const queryClient = renderBanner();

    await settled(queryClient);
    await waitFor(() =>
      expect(
        queryClient
          .getQueryCache()
          .findAll()
          .some((query) => query.state.status === "error"),
      ).toBe(true),
    );
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
