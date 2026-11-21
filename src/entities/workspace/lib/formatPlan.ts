import type { PlanLimits } from "../model/plans.schema";

const numberFormat = new Intl.NumberFormat("en-US");

function pluralize(count: number, singular: string, plural: string): string {
  return `${numberFormat.format(count)} ${count === 1 ? singular : plural}`;
}

/** Whole-dollar prices drop the cents ("$0"), others keep two digits ("$14.99"). */
export function formatPrice(priceMonthlyCents: number): string {
  const hasCents = priceMonthlyCents % 100 !== 0;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(priceMonthlyCents / 100);
}

export function formatClassificationsFeature(limit: PlanLimits["classifications"]): string {
  const suffix = limit.period === "lifetime" ? "in total" : "per month";
  return `${pluralize(limit.limit, "classification", "classifications")} ${suffix}`;
}

export function formatPeopleFeature(seats: number): string {
  return seats === 1 ? "1 person" : `Up to ${numberFormat.format(seats)} people`;
}

/** A plan with 0 uploads and 0 rows has no batch access at all. */
export function hasBatchAccess(batch: PlanLimits["batch"]): boolean {
  return batch.uploadsPerMonth > 0 || batch.maxRows > 0;
}

export function formatBatchFeature(batch: PlanLimits["batch"]): string {
  if (!hasBatchAccess(batch)) return "No batch upload";
  const uploads = pluralize(batch.uploadsPerMonth, "batch upload", "batch uploads");
  return `${uploads} per month, up to ${pluralize(batch.maxRows, "row", "rows")} each`;
}

export function formatRetention(days: number): string {
  if (days < 365) return `${days} days`;
  if (days === 365) return "1 year";
  return `${Math.round((days / 365) * 12)} months`;
}

export function formatRetentionFeature(days: number): string {
  return `Audit trail kept for ${formatRetention(days)}`;
}
