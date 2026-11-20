import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useBatch, useBatchItems } from "./batch.query";

const SEED_BATCH_ID = "batch_seed_001";

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useBatch", () => {
  it("fetches the batch, parsed against the contract schema", async () => {
    const { result } = renderHook(() => useBatch(SEED_BATCH_ID, { pollIntervalMs: 50 }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.id).toBe(SEED_BATCH_ID);
    expect(result.current.data?.filename).toBe("june_apparel_import.csv");
  });

  it("keeps polling while the batch is not complete, and stops once it is", async () => {
    const { result } = renderHook(() => useBatch(SEED_BATCH_ID, { pollIntervalMs: 50 }), {
      wrapper,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const firstClassified = result.current.data?.classified ?? 0;

    await waitFor(
      () => expect(result.current.data?.classified ?? 0).toBeGreaterThan(firstClassified),
      { timeout: 3000 },
    );

    await waitFor(() => expect(result.current.data?.status).toBe("complete"), { timeout: 5000 });
    expect(result.current.isFetching).toBe(false);
  });
});

describe("useBatchItems", () => {
  it("fetches this batch's classifications only", async () => {
    const { result } = renderHook(() => useBatchItems(SEED_BATCH_ID), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.items.length).toBeGreaterThan(0);
    expect(result.current.data?.items.every((item) => item.id.startsWith("cls_"))).toBe(true);
  });
});
