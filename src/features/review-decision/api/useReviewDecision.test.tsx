import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { ApiError, http as httpClient } from "@/shared/api";
import { classificationKeys } from "@/entities/classification";
import { useReviewDecision } from "./useReviewDecision";

// Exercises the real MSW handlers through the real http client (registered
// globally in tests/setup.ts). Each test uses its own seed id so the tests
// stay independent without needing to import the app-layer mock store
// directly (a features slice must not import from `app`).
function makeWrapper() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  function wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }
  return { queryClient, wrapper };
}

describe("useReviewDecision", () => {
  it("approve: sets status to approved, updates the detail cache, and invalidates the list", async () => {
    const { queryClient, wrapper } = makeWrapper();
    queryClient.setQueryData(classificationKeys.list({}), {
      items: [],
      total: 0,
      page: 1,
      pageSize: 50,
    });
    const { result } = renderHook(() => useReviewDecision(), { wrapper });

    result.current.mutate({ id: "cls_002", action: "approve" });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.status).toBe("approved");
    expect(queryClient.getQueryData(classificationKeys.detail("cls_002"))).toMatchObject({
      status: "approved",
    });
    expect(queryClient.getQueryState(classificationKeys.list({}))?.isInvalidated).toBe(true);
  });

  it("reject: requires a reason server-side and returns a 422 ApiError when missing", async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useReviewDecision(), { wrapper });

    result.current.mutate({ id: "cls_003", action: "reject", reason: "" });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(ApiError);
    expect((result.current.error as ApiError).status).toBe(422);
  });

  it("reject: sets status to rejected on success", async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useReviewDecision(), { wrapper });

    result.current.mutate({ id: "cls_005", action: "reject", reason: "Does not match." });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.status).toBe("rejected");
  });

  it("override: sets status to approved with overridden true and the chosen code", async () => {
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useReviewDecision(), { wrapper });

    result.current.mutate({
      id: "cls_006",
      action: "override",
      code: "9405.42",
      reason: "Better match.",
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data).toMatchObject({
      status: "approved",
      overridden: true,
      finalCode: "9405.42",
    });
  });

  it("request_info: sets status to pending", async () => {
    const members = await httpClient.get<{ items: { id: string }[] }>("/members");
    const { wrapper } = makeWrapper();
    const { result } = renderHook(() => useReviewDecision(), { wrapper });

    result.current.mutate({
      id: "cls_008",
      action: "request_info",
      assigneeId: members.items[0].id,
    });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.status).toBe("pending");
  });

  it("undo: restores the previous state", async () => {
    const { wrapper } = makeWrapper();
    const { result: approveResult } = renderHook(() => useReviewDecision(), { wrapper });
    approveResult.current.mutate({ id: "cls_011", action: "approve" });
    await waitFor(() => expect(approveResult.current.isSuccess).toBe(true));

    const { result: undoResult } = renderHook(() => useReviewDecision(), { wrapper });
    undoResult.current.mutate({ id: "cls_011", action: "undo" });
    await waitFor(() => expect(undoResult.current.isSuccess).toBe(true));

    expect(undoResult.current.data?.status).toBe("needs_review");
  });

  it("a failed decision leaves no stale data in the detail cache", async () => {
    const { queryClient, wrapper } = makeWrapper();
    const { result } = renderHook(() => useReviewDecision(), { wrapper });

    result.current.mutate({ id: "cls_013", action: "reject", reason: "" });
    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBeInstanceOf(ApiError);
    expect(queryClient.getQueryData(classificationKeys.detail("cls_013"))).toBeUndefined();
  });
});
