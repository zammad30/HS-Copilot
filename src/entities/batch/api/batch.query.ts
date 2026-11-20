import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { http, parseResponse } from "@/shared/api";
import { classificationListResponseSchema } from "@/entities/classification/@x/batch";
import type { ClassificationsListParams } from "@/entities/classification/@x/batch";
import { batchSchema } from "../model/batch.schema";
import { batchKeys } from "./batch.keys";

const POLL_INTERVAL_MS = 2000;

export function useBatch(id: string | undefined, options?: { pollIntervalMs?: number }) {
  const pollInterval = options?.pollIntervalMs ?? POLL_INTERVAL_MS;

  return useQuery({
    queryKey: batchKeys.detail(id ?? ""),
    queryFn: async () => {
      const data = await http.get(`/batches/${id}`);
      return parseResponse(batchSchema, data);
    },
    enabled: id !== undefined,
    retry: false,
    refetchInterval: (query) => {
      const batch = query.state.data;
      if (!batch) return false;
      return batch.status === "complete" ? false : pollInterval;
    },
  });
}

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

export function useBatchItems(id: string | undefined, params: ClassificationsListParams = {}) {
  return useQuery({
    queryKey: batchKeys.items(id ?? "", params),
    queryFn: async () => {
      const data = await http.get(`/batches/${id}/items${buildQueryString(params)}`);
      return parseResponse(classificationListResponseSchema, data);
    },
    enabled: id !== undefined,
    placeholderData: keepPreviousData,
  });
}
