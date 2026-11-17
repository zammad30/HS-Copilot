import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { http } from "@/shared/api";
import { useSetSession } from "./useSetSession";

export function useSignOut(): () => void {
  const setSession = useSetSession();
  const queryClient = useQueryClient();

  return useCallback(() => {
    // Local-first: the user is signed out immediately regardless of network state.
    setSession(null);

    // Fire-and-forget: a failed request here isn't surfaced yet, so a real
    // cookie-backed session could still be live server-side after this call
    // fails. Show a toast once `Toast` exists instead of swallowing this.
    void http.post("/auth/sign-out").catch(() => {});

    void queryClient.cancelQueries().then(() => queryClient.clear());
  }, [setSession, queryClient]);
}
