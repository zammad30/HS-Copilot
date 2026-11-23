import type { Status } from "../model/classification.schema";

export interface ClassificationsListParams {
  search?: string;
  status?: Status[];
  sort?: string;
  /** Only records inside the expiring window (docs/api-contract.md, Expiry). */
  expiring?: boolean;
  page?: number;
  pageSize?: number;
}

export const classificationKeys = {
  all: ["classifications"] as const,
  lists: () => [...classificationKeys.all, "list"] as const,
  list: (params: ClassificationsListParams = {}) =>
    [...classificationKeys.lists(), params] as const,
  details: () => [...classificationKeys.all, "detail"] as const,
  detail: (id: string) => [...classificationKeys.details(), id] as const,
};
