import type { Classification } from "@/entities/classification";
import { mockNow } from "./mockNow";
import { currentPlanLimits } from "../fixtures/plans.fixtures";
import type { StoredClassification } from "../fixtures/classifications.fixtures";

const DAY_MS = 24 * 60 * 60 * 1000;

/** `min(30, auditRetentionDays / 3)`, per docs/api-contract.md's Expiry
 * section - without the cap, every Free record would always count as
 * expiring, since Free's own retention is already short. */
export function expiringWindowDays(auditRetentionDays: number): number {
  return Math.min(30, auditRetentionDays / 3);
}

function expiresAtMs(item: StoredClassification): number {
  return new Date(item.createdAt).getTime() + currentPlanLimits().auditRetentionDays * DAY_MS;
}

/** Derives `expiresAt` at read time from `createdAt` plus the current plan's
 * retention - never stored, so switching the plan back restores hidden
 * records. A real backend deletes them outright once past this instant. */
export function withExpiresAt(item: StoredClassification): Classification {
  return { ...item, expiresAt: new Date(expiresAtMs(item)).toISOString() };
}

export function isExpired(item: StoredClassification): boolean {
  return expiresAtMs(item) <= mockNow();
}

/** Assumes `!isExpired(item)` - callers filter expired records out first. */
export function isExpiringSoon(item: StoredClassification): boolean {
  const windowMs = expiringWindowDays(currentPlanLimits().auditRetentionDays) * DAY_MS;
  return expiresAtMs(item) - mockNow() <= windowMs;
}
