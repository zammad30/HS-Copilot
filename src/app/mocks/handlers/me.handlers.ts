import { http, HttpResponse } from "msw";
import { env } from "@/shared/config";
import { applyForceDelay, forcedErrorResponse, randomLatency } from "../scenarios";
import { meStore } from "../fixtures/me.fixtures";

interface MePatchBody {
  name?: unknown;
}

export const meHandlers = [
  http.patch(`${env.apiBaseUrl}/me`, async ({ request }) => {
    await randomLatency();
    await applyForceDelay(request);
    const forcedError = forcedErrorResponse(request);
    if (forcedError) return forcedError;

    const body = (await request.json().catch(() => ({}))) as MePatchBody;
    if (typeof body.name === "string" && body.name.trim()) {
      meStore.name = body.name.trim();
    }

    return HttpResponse.json({ name: meStore.name });
  }),
];
