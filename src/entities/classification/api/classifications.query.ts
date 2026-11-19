import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { http, parseResponse } from "@/shared/api";
import { classificationListResponseSchema } from "../model/classification.schema";
import { classificationKeys } from "./classifications.keys";
import type { ClassificationsListParams } from "./classifications.keys";

function buildQueryString(params: ClassificationsListParams): string {
  const query = new URLSearchParams();
  if (params.search) query.set("search", params.search);
  if (params.status?.length) query.set("status", params.status.join(","));
  if (params.sort) query.set("sort", params.sort);
  if (params.page) query.set("page", String(params.page));
  if (params.pageSize) query.set("pageSize", String(params.pageSize));
  const queryString = query.toString();
  return queryString ? `?${queryString}` : "";
}

export function useClassifications(params: ClassificationsListParams = {}) {
  return useQuery({
    queryKey: classificationKeys.list(params),
    queryFn: async () => {
      const data = await http.get(`/classifications${buildQueryString(params)}`);
      return parseResponse(classificationListResponseSchema, data);
    },
    placeholderData: keepPreviousData,
  });
}
