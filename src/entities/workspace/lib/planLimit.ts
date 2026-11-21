import { ApiError } from "@/shared/api";
import { formatDay } from "@/shared/lib/formatDate";
import { planLimitDetailsSchema } from "../model/planLimitError.schema";
import type { PlanLimitDetails } from "../model/planLimitError.schema";
import type { PlanLimits } from "../model/plans.schema";
import { formatCount } from "./formatUsage";

/** Details of a 403 `plan_limit_reached` error, or null for anything else. */
export function parsePlanLimitError(error: unknown): PlanLimitDetails | null {
  if (!(error instanceof ApiError) || error.code !== "plan_limit_reached") return null;
  const parsed = planLimitDetailsSchema.safeParse(error.details);
  return parsed.success ? parsed.data : null;
}

interface PlanLimitMessageContext {
  period?: PlanLimits["classifications"]["period"];
  periodEnd?: string;
  now?: Date;
}

export function planLimitMessage(
  details: PlanLimitDetails,
  { period, periodEnd, now }: PlanLimitMessageContext = {},
): string {
  const limit = formatCount(details.limit);
  switch (details.reason) {
    case "classifications": {
      const base = `You have used all ${limit} classifications in your plan.`;
      // formatDay already carries the word "on" for dates, so it is not repeated.
      return period === "month" && periodEnd
        ? `${base} Your limit resets ${formatDay(periodEnd, now)}.`
        : base;
    }
    case "batch_uploads":
      return `You have used all ${limit} batch uploads for this month.`;
    case "batch_rows":
      return `Your plan allows up to ${limit} rows per batch upload.`;
    case "seats":
      return `Your plan allows ${limit} people.`;
    case "feature":
      return "This is not included in your plan.";
  }
}
