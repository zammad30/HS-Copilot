import { http, HttpResponse } from "msw";
import { env } from "@/shared/config";
import { applyForceDelay, forcedErrorResponse, randomLatency } from "../scenarios";
import { workspaceStore } from "../fixtures/workspace.fixtures";
import {
  currentPlan,
  periodEndForCurrentMonth,
  seatsUsed,
  usageStore,
} from "../fixtures/plans.fixtures";

const VALID_JURISDICTIONS = new Set(["US_HTS", "EU_CN", "UK_UKGT"]);

interface WorkspacePatchBody {
  name?: unknown;
  defaultJurisdiction?: unknown;
}

/** GET /workspace denormalizes the current plan's id, limits and live usage
 * onto the workspace response, per docs/api-contract.md's Plans section. */
function workspaceResponse() {
  const plan = currentPlan();
  return {
    ...workspaceStore,
    plan: plan.id,
    limits: plan.limits,
    usage: {
      classificationsUsed: usageStore.classificationsUsed,
      batchUploadsUsed: usageStore.batchUploadsUsed,
      seatsUsed: seatsUsed(),
      ...(plan.limits.classifications.period === "month"
        ? { periodEnd: periodEndForCurrentMonth() }
        : {}),
    },
  };
}

export const workspaceHandlers = [
  http.get(`${env.apiBaseUrl}/workspace`, async ({ request }) => {
    await randomLatency();
    await applyForceDelay(request);
    const forcedError = forcedErrorResponse(request);
    if (forcedError) return forcedError;

    return HttpResponse.json(workspaceResponse());
  }),

  http.patch(`${env.apiBaseUrl}/workspace`, async ({ request }) => {
    await randomLatency();
    await applyForceDelay(request);
    const forcedError = forcedErrorResponse(request);
    if (forcedError) return forcedError;

    const body = (await request.json().catch(() => ({}))) as WorkspacePatchBody;
    if (typeof body.name === "string" && body.name.trim()) {
      workspaceStore.name = body.name.trim();
    }
    if (
      typeof body.defaultJurisdiction === "string" &&
      VALID_JURISDICTIONS.has(body.defaultJurisdiction)
    ) {
      workspaceStore.defaultJurisdiction =
        body.defaultJurisdiction as typeof workspaceStore.defaultJurisdiction;
    }

    return HttpResponse.json(workspaceResponse());
  }),
];
