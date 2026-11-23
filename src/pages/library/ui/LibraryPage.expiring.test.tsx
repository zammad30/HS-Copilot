import { describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createMemoryRouter, RouterProvider, useLocation } from "react-router";
import { http as mswHttp, HttpResponse } from "msw";
import { server } from "../../../../tests/mswServer";
import { env } from "@/shared/config";
import { http } from "@/shared/api";
import { ToastProvider } from "@/shared/ui/Toast";
import { LibraryPage } from "./LibraryPage";

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{`${location.pathname}${location.search}`}</p>;
}

function renderLibrary(initialPath: string) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const router = createMemoryRouter(
    [
      {
        path: "/app/library",
        Component: () => (
          <>
            <LibraryPage />
            <LocationProbe />
          </>
        ),
      },
    ],
    { initialEntries: [initialPath] },
  );
  render(
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>,
  );
}

const CHIP_NAME = "Remove filter: Expiring soon";
const chip = () => screen.queryByRole("button", { name: CHIP_NAME });

function recordEmptyListRequests() {
  const urls: URL[] = [];
  server.use(
    mswHttp.get(`${env.apiBaseUrl}/classifications`, ({ request }) => {
      urls.push(new URL(request.url));
      return HttpResponse.json({ items: [], total: 0, page: 1, pageSize: 10 });
    }),
  );
  return urls;
}

describe("LibraryPage - expiring filter", () => {
  it("sends expiring=true and shows the chip when the URL has the flag", async () => {
    const urls = recordEmptyListRequests();
    renderLibrary("/app/library?expiring=true");

    expect(await screen.findByRole("button", { name: CHIP_NAME })).toBeVisible();
    expect(screen.getByText("Expiring soon")).toBeInTheDocument();
    await waitFor(() =>
      expect(
        urls.some(
          (url) => url.searchParams.get("expiring") === "true" && url.searchParams.has("sort"),
        ),
      ).toBe(true),
    );
  });

  it("lists only the expiring record on Free", async () => {
    await http.put("/__mock/plan", { plan: "free" });
    renderLibrary("/app/library?expiring=true");

    expect(await screen.findByText(/Showing 1.1 of 1$/)).toBeInTheDocument();
  });

  it("clearing the chip removes the param and restores the normal list", async () => {
    await http.put("/__mock/plan", { plan: "free" });
    renderLibrary("/app/library?expiring=true");

    await userEvent.click(await screen.findByRole("button", { name: CHIP_NAME }));

    await waitFor(() => expect(chip()).not.toBeInTheDocument());
    expect(screen.getByTestId("location")).not.toHaveTextContent("expiring");
    expect(await screen.findByText(/Showing 1.\d+ of \d+/)).toBeInTheDocument();
  });

  it("combines with a status filter and search", async () => {
    const urls = recordEmptyListRequests();
    renderLibrary("/app/library?expiring=true&status=needs_review&q=shirt");

    await waitFor(() =>
      expect(
        urls.some(
          (url) =>
            url.searchParams.get("expiring") === "true" &&
            url.searchParams.get("status") === "needs_review" &&
            url.searchParams.get("search") === "shirt",
        ),
      ).toBe(true),
    );
    expect(await screen.findByRole("checkbox", { name: "Needs review" })).toBeChecked();
    expect(chip()).toBeInTheDocument();
    expect(await screen.findByText("No classifications match these filters.")).toBeInTheDocument();
  });

  it("shows the expiring empty state with Clear filter when nothing is expiring", async () => {
    renderLibrary("/app/library?expiring=true");

    expect(await screen.findByText("No records are expiring soon.")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Clear filter" }));

    await waitFor(() => expect(screen.getByTestId("location")).not.toHaveTextContent("expiring"));
    expect(await screen.findByText(/Showing 1.10 of 14/)).toBeInTheDocument();
  });

  it("Clear filters also removes the expiring flag", async () => {
    renderLibrary("/app/library?expiring=true&status=pending");

    await userEvent.click(await screen.findByRole("button", { name: "Clear filters" }));

    await waitFor(() => expect(chip()).not.toBeInTheDocument());
    expect(screen.getByTestId("location")).not.toHaveTextContent("expiring");
    expect(screen.getByTestId("location")).not.toHaveTextContent("status");
  });

  it("shows the banner only while the filter is off", async () => {
    await http.put("/__mock/plan", { plan: "free" });
    renderLibrary("/app/library");

    expect(await screen.findByText(/1 record will expire within 10 days\./)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("link", { name: "Show them" }));

    expect(await screen.findByRole("button", { name: CHIP_NAME })).toBeVisible();
    expect(screen.queryByText(/will expire within/)).not.toBeInTheDocument();
  });
});
