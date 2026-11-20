import { HttpResponse } from "msw";

export type PlanLimitReason =
  "classifications" | "batch_uploads" | "batch_rows" | "seats" | "feature";

/** Shared 403 shape for every plan-limit refusal, per docs/api-contract.md's
 * "Limit errors" section. */
export function planLimitReachedResponse(
  reason: PlanLimitReason,
  limit: number,
  used: number,
): Response {
  return HttpResponse.json(
    {
      error: {
        code: "plan_limit_reached",
        message: "This plan has reached its limit.",
        details: { reason, limit, used },
      },
    },
    { status: 403 },
  );
}
