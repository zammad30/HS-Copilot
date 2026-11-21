import { useQuery } from "@tanstack/react-query";
import { http, parseResponse } from "@/shared/api";
import { planListResponseSchema } from "../model/plans.schema";
import { workspaceKeys } from "./workspace.keys";

export function usePlans() {
  return useQuery({
    queryKey: workspaceKeys.plans(),
    queryFn: async () => {
      const data = await http.get("/plans");
      return parseResponse(planListResponseSchema, data);
    },
  });
}
