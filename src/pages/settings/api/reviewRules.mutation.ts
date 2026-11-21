import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http, parseResponse } from "@/shared/api";
import { reviewRulesSchema, reviewRulesKeys } from "@/entities/review-rule";
import type { ReviewRules } from "@/entities/review-rule";
import { parsePlanLimitError, workspaceKeys } from "@/entities/workspace";

export function useUpdateReviewRules() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: ReviewRules) => {
      const data = await http.put("/review-rules", input);
      return parseResponse(reviewRulesSchema, data);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(reviewRulesKeys.detail(), updated);
    },
    // A plan-limit refusal means the plan data on screen was stale.
    onError: (error) => {
      if (parsePlanLimitError(error)) {
        void queryClient.invalidateQueries({ queryKey: workspaceKeys.detail() });
      }
    },
  });
}
