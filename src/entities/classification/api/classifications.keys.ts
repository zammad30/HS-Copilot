import type { Status } from "../model/classification.schema";

export interface ClassificationsListParams {
  status?: Status[];
  sort?: string;
  page?: number;
  pageSize?: number;
}

export const classificationKeys = {
  all: ["classifications"] as const,
  list: (params: ClassificationsListParams = {}) =>
    [...classificationKeys.all, "list", params] as const,
};
