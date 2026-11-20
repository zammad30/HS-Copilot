import { http, HttpResponse } from "msw";
import { env } from "@/shared/config";
import { applyForceDelay, forcedErrorResponse, randomLatency } from "../scenarios";
import { reviewRulesStore } from "../fixtures/reviewRules.fixtures";
import type { ReviewRulesFixture } from "../fixtures/reviewRules.fixtures";
import { currentPlanLimits } from "../fixtures/plans.fixtures";
import { planLimitReachedResponse } from "../support/planLimitError";

export const reviewRulesHandlers = [
  http.get(`${env.apiBaseUrl}/review-rules`, async ({ request }) => {
    await randomLatency();
    await applyForceDelay(request);
    const forcedError = forcedErrorResponse(request);
    if (forcedError) return forcedError;

    return HttpResponse.json(reviewRulesStore);
  }),

  http.put(`${env.apiBaseUrl}/review-rules`, async ({ request }) => {
    await randomLatency();
    await applyForceDelay(request);
    const forcedError = forcedErrorResponse(request);
    if (forcedError) return forcedError;

    const body = (await request.json().catch(() => ({}))) as Partial<ReviewRulesFixture>;

    if (
      Array.isArray(body.secondApproverChapters) &&
      body.secondApproverChapters.length > 0 &&
      !currentPlanLimits().secondApprover
    ) {
      return planLimitReachedResponse("feature", 0, body.secondApproverChapters.length);
    }

    Object.assign(reviewRulesStore, body);

    return HttpResponse.json(reviewRulesStore);
  }),
];
