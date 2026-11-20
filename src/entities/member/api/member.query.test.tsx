import { describe, expect, it } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useMembers } from "./member.query";

function wrapper({ children }: { children: ReactNode }) {
  const queryClient = new QueryClient();
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

describe("useMembers", () => {
  it("fetches the workspace member list, parsed against the contract schema", async () => {
    const { result } = renderHook(() => useMembers(), { wrapper });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(result.current.data?.items.length).toBeGreaterThan(0);
    expect(result.current.data?.items.map((member) => member.name)).toContain("Alex Morgan");
  });
});
