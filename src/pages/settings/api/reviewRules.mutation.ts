import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http, parseResponse } from "@/shared/api";
import { reviewRulesSchema } from "../model/reviewRules.schema";
import type { ReviewRules } from "../model/reviewRules.schema";
import { reviewRulesKeys } from "./reviewRules.keys";

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
  });
}
