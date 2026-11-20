import { http, HttpResponse } from "msw";
import { env } from "@/shared/config";
import { applyForceDelay, forcedErrorResponse, randomLatency } from "../scenarios";
import { workspaceStore } from "../fixtures/workspace.fixtures";

const VALID_JURISDICTIONS = new Set(["US_HTS", "EU_CN", "UK_UKGT"]);

interface WorkspacePatchBody {
  name?: unknown;
  defaultJurisdiction?: unknown;
}

export const workspaceHandlers = [
  http.get(`${env.apiBaseUrl}/workspace`, async ({ request }) => {
    await randomLatency();
    await applyForceDelay(request);
    const forcedError = forcedErrorResponse(request);
    if (forcedError) return forcedError;

    return HttpResponse.json(workspaceStore);
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

    return HttpResponse.json(workspaceStore);
  }),
];
