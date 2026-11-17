import { http, HttpResponse } from "msw";
import { env } from "@/shared/config";
import { forcedErrorResponse, randomLatency } from "../scenarios";
import { buildSessionFixture } from "../fixtures/auth.fixtures";

interface AuthRequestBody {
  email?: unknown;
}

// Reads only the email — the password is never inspected or echoed back.
async function readEmail(request: Request): Promise<string> {
  const body = (await request
    .clone()
    .json()
    .catch(() => ({}))) as AuthRequestBody;
  return typeof body.email === "string" ? body.email : "reviewer@hs-copilot.test";
}

export const authHandlers = [
  http.post(`${env.apiBaseUrl}/auth/sign-in`, async ({ request }) => {
    await randomLatency();
    return (
      forcedErrorResponse(request) ??
      HttpResponse.json({ session: buildSessionFixture(await readEmail(request)) })
    );
  }),

  http.post(`${env.apiBaseUrl}/auth/sign-up`, async ({ request }) => {
    await randomLatency();
    return (
      forcedErrorResponse(request) ??
      HttpResponse.json({ session: buildSessionFixture(await readEmail(request)) })
    );
  }),

  http.post(`${env.apiBaseUrl}/auth/reset`, async ({ request }) => {
    await randomLatency();
    // Always succeeds for any syntactically valid email — never reveals whether an account exists.
    return forcedErrorResponse(request) ?? HttpResponse.json({ ok: true });
  }),

  http.post(`${env.apiBaseUrl}/auth/sign-out`, async ({ request }) => {
    await randomLatency();
    return forcedErrorResponse(request) ?? new HttpResponse(null, { status: 204 });
  }),
];
