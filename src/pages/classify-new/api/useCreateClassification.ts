import { useMutation } from "@tanstack/react-query";
import { http, parseResponse } from "@/shared/api";
import type { Jurisdiction } from "@/entities/classification";
import { createClassificationResponseSchema } from "../model/agentRun.schema";

export interface CreateClassificationBody {
  description: string;
  attributes: { material?: string; intendedUse?: string; origin?: string };
  jurisdiction: Jurisdiction;
}

// Page-local (architecture rule 7): only this page creates a classification run.
export function useCreateClassification() {
  return useMutation({
    mutationFn: async (body: CreateClassificationBody) => {
      const data = await http.post("/classifications", body);
      return parseResponse(createClassificationResponseSchema, data);
    },
  });
}
