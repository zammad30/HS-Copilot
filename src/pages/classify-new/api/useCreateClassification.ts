import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http, parseResponse } from "@/shared/api";
import type { Jurisdiction } from "@/entities/classification";
import { parsePlanLimitError, workspaceKeys } from "@/entities/workspace";
import { createClassificationResponseSchema } from "../model/agentRun.schema";

export interface CreateClassificationBody {
  description: string;
  attributes: { material?: string; intendedUse?: string; origin?: string };
  jurisdiction: Jurisdiction;
}

// Page-local (architecture rule 7): only this page creates a classification run.
export function useCreateClassification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateClassificationBody) => {
      const data = await http.post("/classifications", body);
      return parseResponse(createClassificationResponseSchema, data);
    },
    // A creation uses one classification of the quota, so the usage figures are stale.
    // Not awaited, so starting the run never waits on the quota refetch.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.detail() });
    },
    // A refused creation means the page's usage figures were stale; refetch them.
    onError: (error) => {
      if (parsePlanLimitError(error)) {
        void queryClient.invalidateQueries({ queryKey: workspaceKeys.detail() });
      }
    },
  });
}
