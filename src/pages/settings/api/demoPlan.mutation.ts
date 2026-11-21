import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/shared/api";
import type { PlanId } from "@/entities/workspace";

// Mock-only endpoint (docs/api-contract.md, Mock-only): it does not exist on the real API.
export function useSwitchDemoPlan() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (plan: PlanId) => http.put("/__mock/plan", { plan }),
    // A plan switch changes limits, usage and expiry everywhere, so every cached query is stale.
    onSuccess: () => queryClient.invalidateQueries(),
  });
}
