import type { ClassificationsListParams } from "@/entities/classification/@x/batch";

export const batchKeys = {
  all: ["batches"] as const,
  details: () => [...batchKeys.all, "detail"] as const,
  detail: (id: string) => [...batchKeys.details(), id] as const,
  items: (id: string, params: ClassificationsListParams = {}) =>
    [...batchKeys.detail(id), "items", params] as const,
};
