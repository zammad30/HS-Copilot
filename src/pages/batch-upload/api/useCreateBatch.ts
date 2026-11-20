import { useMutation } from "@tanstack/react-query";
import { http, parseResponse } from "@/shared/api";
import { batchSchema } from "@/entities/batch";
import type { Jurisdiction } from "@/entities/classification";

export interface CreateBatchInput {
  file: File;
  mapping: { description: string; sku?: string; material?: string };
  jurisdiction: Jurisdiction;
}

// Page-local (architecture rule 7): only this page creates a batch.
export function useCreateBatch() {
  return useMutation({
    mutationFn: async (input: CreateBatchInput) => {
      const formData = new FormData();
      formData.set("file", input.file);
      formData.set("mapping", JSON.stringify(input.mapping));
      formData.set("jurisdiction", input.jurisdiction);
      const data = await http.post("/batches", formData);
      return parseResponse(batchSchema, data);
    },
  });
}
