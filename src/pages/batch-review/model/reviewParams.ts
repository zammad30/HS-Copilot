import { statusSchema } from "@/entities/classification";
import type { Status } from "@/entities/classification";

export const PAGE_SIZE = 10;

export const STATUS_FILTER_OPTIONS: { value: Status; label: string }[] = [
  { value: "approved", label: "Approved" },
  { value: "needs_review", label: "Needs review" },
  { value: "rejected", label: "Rejected" },
  { value: "pending", label: "Pending" },
];

export function parseStatusParam(raw: string | null): Status[] {
  if (!raw) return [];
  return raw
    .split(",")
    .map((value) => value.trim())
    .filter((value): value is Status => statusSchema.safeParse(value).success);
}

export function parsePageParam(raw: string | null): number {
  const value = Number(raw);
  return Number.isInteger(value) && value >= 1 ? value : 1;
}
