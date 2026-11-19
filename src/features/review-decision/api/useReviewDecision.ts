import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/shared/api";
import { classificationKeys } from "@/entities/classification";
import type { Classification } from "@/entities/classification";
import type { DecisionInput } from "../model/decision.schema";

export function useReviewDecision() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...body }: DecisionInput) =>
      http.post<Classification>(`/classifications/${id}/decision`, body),
    onSuccess: (updated, variables) => {
      queryClient.setQueryData(classificationKeys.detail(variables.id), updated);
      void queryClient.invalidateQueries({ queryKey: classificationKeys.lists() });
    },
  });
}
