import { http, HttpResponse } from "msw";
import { env } from "@/shared/config";
import { applyForceDelay, forcedErrorResponse, randomLatency } from "../scenarios";
import { membersFixtures } from "../fixtures/members.fixtures";

export const membersHandlers = [
  http.get(`${env.apiBaseUrl}/members`, async ({ request }) => {
    await randomLatency();
    await applyForceDelay(request);
    const forcedError = forcedErrorResponse(request);
    if (forcedError) return forcedError;

    return HttpResponse.json({
      items: membersFixtures,
      total: membersFixtures.length,
      page: 1,
      pageSize: membersFixtures.length,
    });
  }),
];
