import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/shared/api";
import { classificationKeys } from "@/entities/classification";

export function useDeleteClassification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => http.delete(`/classifications/${id}`),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: classificationKeys.all });
    },
  });
}
