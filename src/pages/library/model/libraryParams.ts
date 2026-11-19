import { statusSchema } from "@/entities/classification";
import type { Status } from "@/entities/classification";

export const PAGE_SIZE = 10;

export const STATUS_FILTER_OPTIONS: { value: Status; label: string }[] = [
  { value: "approved", label: "Approved" },
  { value: "needs_review", label: "Needs review" },
  { value: "rejected", label: "Rejected" },
  { value: "pending", label: "Pending" },
];

/** Parses the `status` URL param (comma-separated), silently dropping unknown values. */
export function parseStatusParam(raw: string | null): Status[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value): value is Status => statusSchema.safeParse(value).success);
}

export function serializeStatusParam(statuses: Status[]): string | null {
  return statuses.length > 0 ? statuses.join(",") : null;
}

/** Parses the `page` URL param, defaulting to 1 for anything missing or not a positive integer. */
export function parsePageParam(raw: string | null): number {
  const value = Number(raw);
  return Number.isInteger(value) && value >= 1 ? value : 1;
}
