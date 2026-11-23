import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useClassifications } from "./classifications.query";

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

// Read-only (GET) tests - no mutation here, so no store reset is needed, and
// this entity-layer test correctly never imports the app-layer mock fixtures.
describe("useClassifications", () => {
  it("fetches the paginated list, parsed against the contract schema", async () => {
    const { result } = renderHook(() => useClassifications(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.items).toHaveLength(14);
    expect(result.current.data?.total).toBe(14);
  });

  it("filters by status via a comma-separated query param", async () => {
    const { result } = renderHook(
      () => useClassifications({ status: ["needs_review", "pending"] }),
      {
        wrapper,
      },
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.items.length).toBeGreaterThan(0);
    for (const item of result.current.data?.items ?? []) {
      expect(["needs_review", "pending"]).toContain(item.status);
    }
  });

  it("sends expiring=true and returns only records inside the window", async () => {
    const { result } = renderHook(() => useClassifications({ expiring: true, pageSize: 1 }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    // Team (the mock default) has nothing inside its 30 day window.
    expect(result.current.data?.total).toBe(0);
  });
});
