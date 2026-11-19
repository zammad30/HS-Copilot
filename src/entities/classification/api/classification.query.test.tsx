import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ApiError } from "@/shared/api";
import { useClassification } from "./classification.query";

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useClassification", () => {
  it("fetches a single classification by id, parsed against the contract schema", async () => {
    const { result } = renderHook(() => useClassification("cls_002"), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.id).toBe("cls_002");
    expect(result.current.data?.candidates.length).toBeGreaterThan(0);
  });

  it("surfaces a 404 ApiError for an unknown id", async () => {
    const { result } = renderHook(() => useClassification("does-not-exist"), { wrapper });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(ApiError);
    expect((result.current.error as ApiError).code).toBe("not_found");
  });
});
