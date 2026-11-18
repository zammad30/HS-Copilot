import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/shared/api";
import { classificationKeys } from "@/entities/classification";

// Page-local for now (architecture rule 7) — moves to features/review-decision
// once a second consumer (classification-detail) needs the same mutation.
export function useDeleteClassification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => http.delete(`/classifications/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: classificationKeys.all });
    },
  });
}
