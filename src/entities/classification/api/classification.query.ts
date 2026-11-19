import { useQuery } from "@tanstack/react-query";
import { http, parseResponse } from "@/shared/api";
import { classificationSchema } from "../model/classification.schema";
import { classificationKeys } from "./classifications.keys";

export function useClassification(id: string) {
  return useQuery({
    queryKey: classificationKeys.detail(id),
    queryFn: async () => {
      const data = await http.get(`/classifications/${id}`);
      return parseResponse(classificationSchema, data);
    },
    enabled: Boolean(id),
  });
}
