import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http, parseResponse } from "@/shared/api";
import { batchSchema, batchKeys } from "@/entities/batch";
import { classificationKeys } from "@/entities/classification";

// Page-local (architecture rule 7): only this page controls a batch's run.
export function usePauseBatch(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const data = await http.post(`/batches/${id}/pause`);
      return parseResponse(batchSchema, data);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(batchKeys.detail(id), updated);
    },
  });
}

export function useResumeBatch(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const data = await http.post(`/batches/${id}/resume`);
      return parseResponse(batchSchema, data);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(batchKeys.detail(id), updated);
    },
  });
}

export interface BulkApproveResult {
  approvedCount: number;
}

export function useBulkApprove(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (minConfidence: number) => {
      const data = await http.post<BulkApproveResult>(`/batches/${id}/bulk-approve`, {
        minConfidence,
      });
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: batchKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: classificationKeys.all });
    },
  });
}
