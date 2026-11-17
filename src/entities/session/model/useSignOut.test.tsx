import { describe, expect, it, vi } from "vitest";
import { act } from "react";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import type { ReactNode } from "react";
import { http as httpClient } from "@/shared/api";
import { SessionContext } from "./sessionContext";
import type { Session } from "./session.schema";
import { useSession } from "./useSession";
import { useSignOut } from "./useSignOut";

vi.mock("@/shared/api", async () => {
  const actual = await vi.importActual<typeof import("@/shared/api")>("@/shared/api");
  return { ...actual, http: { ...actual.http, post: vi.fn() } };
});

const TEST_SESSION: Session = {
  userId: "user_1",
  email: "reviewer@hs-copilot.test",
  workspaceId: "workspace_1",
};

function wrapper(queryClient: QueryClient) {
  return function Wrapper({ children }: { children: ReactNode }) {
    const [session, setSession] = useState<Session | null>(TEST_SESSION);
    return (
      <QueryClientProvider client={queryClient}>
        <SessionContext.Provider value={{ session, setSession }}>
          {children}
        </SessionContext.Provider>
      </QueryClientProvider>
    );
  };
}

function useHarness() {
  return { signOut: useSignOut(), session: useSession() };
}

describe("useSignOut", () => {
  it("clears the session before cancelling and clearing the query cache, and calls the endpoint", async () => {
    vi.mocked(httpClient.post).mockResolvedValueOnce(undefined);
    const queryClient = new QueryClient();
    const callOrder: string[] = [];
    vi.spyOn(queryClient, "cancelQueries").mockImplementation(async () => {
      callOrder.push("cancelQueries");
    });
    vi.spyOn(queryClient, "clear").mockImplementation(() => {
      callOrder.push("clear");
    });

    const { result } = renderHook(() => useHarness(), { wrapper: wrapper(queryClient) });

    act(() => result.current.signOut());

    // Local session clears synchronously, ahead of any network or cache work.
    expect(result.current.session).toBeNull();

    await waitFor(() => expect(queryClient.clear).toHaveBeenCalled());
    expect(callOrder).toEqual(["cancelQueries", "clear"]);
    expect(httpClient.post).toHaveBeenCalledWith("/auth/sign-out");
  });

  it("still signs out locally when the sign-out request fails", async () => {
    vi.mocked(httpClient.post).mockRejectedValueOnce(new Error("network down"));
    const queryClient = new QueryClient();

    const { result } = renderHook(() => useHarness(), { wrapper: wrapper(queryClient) });

    act(() => result.current.signOut());

    expect(result.current.session).toBeNull();
    await waitFor(() => expect(httpClient.post).toHaveBeenCalledWith("/auth/sign-out"));
  });
});
