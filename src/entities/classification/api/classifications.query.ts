import { useQuery } from "@tanstack/react-query";
import { http, parseResponse } from "@/shared/api";
import { classificationListResponseSchema } from "../model/classification.schema";
import { classificationKeys } from "./classifications.keys";
import type { ClassificationsListParams } from "./classifications.keys";

function buildQueryString(params: ClassificationsListParams): string {
  const search = new URLSearchParams();
  if (params.status?.length) search.set("status", params.status.join(","));
  if (params.sort) search.set("sort", params.sort);
  if (params.page) search.set("page", String(params.page));
  if (params.pageSize) search.set("pageSize", String(params.pageSize));
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function useClassifications(params: ClassificationsListParams = {}) {
  return useQuery({
    queryKey: classificationKeys.list(params),
    queryFn: async () => {
      const data = await http.get(`/classifications${buildQueryString(params)}`);
      return parseResponse(classificationListResponseSchema, data);
    },
  });
}
