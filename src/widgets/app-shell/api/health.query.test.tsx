import { describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { http as httpClient } from "@/shared/api";
import { useHealthCheck } from "./health.query";

vi.mock("@/shared/api", async () => {
  const actual = await vi.importActual<typeof import("@/shared/api")>("@/shared/api");
  return { ...actual, http: { ...actual.http, get: vi.fn() } };
});

function wrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useHealthCheck", () => {
  it("resolves with a parsed success response", async () => {
    vi.mocked(httpClient.get).mockResolvedValueOnce({ status: "ok" });
    const queryClient = new QueryClient();

    const { result } = renderHook(() => useHealthCheck(), { wrapper: wrapper(queryClient) });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ status: "ok" });
  });

  it("retries 3 times before settling into isError", async () => {
    vi.mocked(httpClient.get).mockRejectedValue(new Error("down"));
    // retryDelay: 0 keeps the 3 real retries fast without changing the hook's own retry count.
    const queryClient = new QueryClient({ defaultOptions: { queries: { retryDelay: 0 } } });

    const { result } = renderHook(() => useHealthCheck(), { wrapper: wrapper(queryClient) });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(httpClient.get).toHaveBeenCalledTimes(4);
  });
});
