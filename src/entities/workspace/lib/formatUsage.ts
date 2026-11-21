import { formatDay } from "@/shared/lib/formatDate";
import type { PlanLimits } from "../model/plans.schema";
import { hasBatchAccess } from "./formatPlan";

const numberFormat = new Intl.NumberFormat("en-US");

export function formatCount(count: number): string {
  return numberFormat.format(count);
}

/** `3 of 1,300`. `used` may exceed `limit` after a downgrade. */
export function formatUsageCount(used: number, limit: number): string {
  return `${formatCount(used)} of ${formatCount(limit)}`;
}

/**
 * `Resets on Nov 30`, or `Resets today`. formatDay already carries the word
 * "on" for dates, so it is never added a second time here.
 */
export function formatResetsOn(periodEnd: string, now: Date = new Date()): string {
  return `Resets ${formatDay(periodEnd, now)}`;
}

interface UsageContext {
  periodEnd?: string;
  now?: Date;
}

/** `3 of 1,300 classifications used this month. Resets on Nov 30.` */
export function formatClassificationsQuotaLine(
  used: number,
  limit: PlanLimits["classifications"],
  { periodEnd, now }: UsageContext = {},
): string {
  const period = limit.period === "lifetime" ? "in total" : "this month";
  const base = `${formatUsageCount(used, limit.limit)} classifications used ${period}.`;
  if (limit.period === "month" && periodEnd) return `${base} ${formatResetsOn(periodEnd, now)}.`;
  return base;
}

/** `3 of 1,300 per month` or `3 of 5 in total`, for the Settings plan block. */
export function formatClassificationsUsage(
  used: number,
  limit: PlanLimits["classifications"],
): string {
  const period = limit.period === "lifetime" ? "in total" : "per month";
  return `${formatUsageCount(used, limit.limit)} ${period}`;
}

/** `1 of 10 this month, up to 500 rows each`, or `Not included`. */
export function formatBatchUsage(used: number, batch: PlanLimits["batch"]): string {
  if (!hasBatchAccess(batch)) return "Not included";
  return `${formatUsageCount(used, batch.uploadsPerMonth)} this month, up to ${formatCount(batch.maxRows)} rows each`;
}
