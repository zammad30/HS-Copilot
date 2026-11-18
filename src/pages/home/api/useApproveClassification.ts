import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/shared/api";
import { classificationKeys } from "@/entities/classification";

// Page-local for now (architecture rule 7) — moves to features/review-decision
// once a second consumer (classification-detail) needs the same mutation.
export function useApproveClassification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => http.post(`/classifications/${id}/decision`, { action: "approve" }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: classificationKeys.all });
    },
  });
}
