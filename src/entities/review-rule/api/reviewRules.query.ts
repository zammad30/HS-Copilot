import { useQuery } from "@tanstack/react-query";
import { http, parseResponse } from "@/shared/api";
import { reviewRulesSchema } from "../model/reviewRules.schema";
import { reviewRulesKeys } from "./reviewRules.keys";

export function useReviewRules() {
  return useQuery({
    queryKey: reviewRulesKeys.detail(),
    queryFn: async () => {
      const data = await http.get("/review-rules");
      return parseResponse(reviewRulesSchema, data);
    },
  });
}
