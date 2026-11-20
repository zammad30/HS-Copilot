import { mockNow } from "../support/mockNow";
import { membersStore } from "./members.fixtures";

export type PlanId = "free" | "solo" | "team";

export interface PlanLimitsFixture {
  classifications: { limit: number; period: "lifetime" | "month" };
  seats: number;
  batch: { uploadsPerMonth: number; maxRows: number };
  secondApprover: boolean;
  auditRetentionDays: number;
}

export interface PlanFixture {
  id: PlanId;
  name: string;
  priceMonthlyCents: number;
  limits: PlanLimitsFixture;
  isSample: boolean;
}

/** Matches docs/api-contract.md's "Plans" sample catalog exactly. */
export const PLAN_CATALOG: PlanFixture[] = [
  {
    id: "free",
    name: "Free",
    priceMonthlyCents: 0,
    limits: {
      classifications: { limit: 5, period: "lifetime" },
      seats: 1,
      batch: { uploadsPerMonth: 0, maxRows: 0 },
      secondApprover: false,
      auditRetentionDays: 30,
    },
    isSample: true,
  },
  {
    id: "solo",
    name: "Solo",
    priceMonthlyCents: 1499,
    limits: {
      classifications: { limit: 100, period: "month" },
      seats: 1,
      batch: { uploadsPerMonth: 3, maxRows: 50 },
      secondApprover: false,
      auditRetentionDays: 365,
    },
    isSample: true,
  },
  {
    id: "team",
    name: "Team",
    priceMonthlyCents: 2999,
    limits: {
      classifications: { limit: 1000, period: "month" },
      seats: 5,
      batch: { uploadsPerMonth: 10, maxRows: 500 },
      secondApprover: true,
      auditRetentionDays: 730,
    },
    isSample: true,
  },
];

const DEFAULT_PLAN: PlanId = "team";

interface PlanStore {
  plan: PlanId;
}

/** Mock-only: switched via PUT /__mock/plan. Default matches the contract's
 * "Mock-only" section. */
export const planStore: PlanStore = { plan: DEFAULT_PLAN };

export function resetPlanStore(): void {
  planStore.plan = DEFAULT_PLAN;
}

export function currentPlan(): PlanFixture {
  return PLAN_CATALOG.find((plan) => plan.id === planStore.plan) ?? PLAN_CATALOG[2];
}

export function currentPlanLimits(): PlanLimitsFixture {
  return currentPlan().limits;
}

export interface PlanUsageFixture {
  classificationsUsed: number;
  batchUploadsUsed: number;
}

const DEFAULT_USAGE: PlanUsageFixture = { classificationsUsed: 3, batchUploadsUsed: 0 };

/** Mock-only usage counters. classificationsUsed is incremented in exactly
 * one place per creation path: POST /classifications (by 1) and POST
 * /batches (by its row count) - never inside a fixture builder. */
export const usageStore: PlanUsageFixture = { ...DEFAULT_USAGE };

export function resetUsageStore(): void {
  Object.assign(usageStore, DEFAULT_USAGE);
}

/** Members plus pending invites, per docs/api-contract.md's seatsUsed rule. */
export function seatsUsed(): number {
  return membersStore.length;
}

/** End of the current month at 23:59:59.999, for monthly plans' periodEnd. */
export function periodEndForCurrentMonth(): string {
  const now = new Date(mockNow());
  return new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();
}
