import { http, HttpResponse } from "msw";
import { env } from "@/shared/config";
import { applyForceDelay, forcedErrorResponse, randomLatency } from "../scenarios";
import { PLAN_CATALOG, planStore } from "../fixtures/plans.fixtures";
import type { PlanId } from "../fixtures/plans.fixtures";

const VALID_PLAN_IDS = new Set<PlanId>(["free", "solo", "team"]);

export const plansHandlers = [
  http.get(`${env.apiBaseUrl}/plans`, async ({ request }) => {
    await randomLatency();
    await applyForceDelay(request);
    const forcedError = forcedErrorResponse(request);
    if (forcedError) return forcedError;

    return HttpResponse.json({ items: PLAN_CATALOG });
  }),

  // Mock-only: not part of the real API. Switches the mock workspace's plan.
  http.put(`${env.apiBaseUrl}/__mock/plan`, async ({ request }) => {
    const body = (await request.json().catch(() => ({}))) as { plan?: unknown };
    if (typeof body.plan !== "string" || !VALID_PLAN_IDS.has(body.plan as PlanId)) {
      return HttpResponse.json(
        { error: { code: "validation_error", message: "Unsupported plan." } },
        { status: 422 },
      );
    }

    planStore.plan = body.plan as PlanId;
    return HttpResponse.json({ plan: planStore.plan });
  }),
];
