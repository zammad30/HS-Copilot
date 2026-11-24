import { describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { http as httpClient } from "@/shared/api";
import { pendingDescriptionDraft } from "./pendingDescriptionDraft";
import { useSignOut } from "./useSignOut";

vi.mock("@/shared/api", async () => {
  const actual = await vi.importActual<typeof import("@/shared/api")>("@/shared/api");
  return { ...actual, http: { ...actual.http, post: vi.fn() } };
});

describe("useSignOut - pending draft", () => {
  it("clears a saved description draft", async () => {
    vi.mocked(httpClient.post).mockResolvedValueOnce(undefined);
    pendingDescriptionDraft.save("Frozen shrimp", 1000);
    const queryClient = new QueryClient();
    const wrapper = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );

    const { result } = renderHook(() => useSignOut(), { wrapper });
    act(() => result.current());

    expect(pendingDescriptionDraft.read(1000)).toBeUndefined();
    await waitFor(() => expect(httpClient.post).toHaveBeenCalledWith("/auth/sign-out"));
  });
});
