import { http, HttpResponse } from "msw";
import { env } from "@/shared/config";
import type { AuditEntry, DecisionAction } from "@/entities/classification";
import { applyForceDelay, forcedErrorResponse, randomLatency } from "../scenarios";
import { classificationsStore } from "../fixtures/classifications.fixtures";

interface DecisionRequestBody {
  action?: DecisionAction;
}

function notFound(): Response {
  return HttpResponse.json(
    { error: { code: "not_found", message: "Classification not found" } },
    { status: 404 },
  );
}

export const classificationsHandlers = [
  http.get(`${env.apiBaseUrl}/classifications`, async ({ request }) => {
    await randomLatency();
    await applyForceDelay(request);
    const forcedError = forcedErrorResponse(request);
    if (forcedError) return forcedError;

    const url = new URL(request.url);
    const statusParam = url.searchParams.get("status");
    const statusFilter = statusParam ? statusParam.split(",") : null;
    const page = Number(url.searchParams.get("page") ?? "1");
    const pageSize = Number(url.searchParams.get("pageSize") ?? "50");

    const filtered = statusFilter
      ? classificationsStore.filter((item) => statusFilter.includes(item.status))
      : classificationsStore;
    // Only sort supported so far: most-recently-updated first, the only
    // ordering any current consumer (Home) asks for.
    const sorted = [...filtered].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    const start = (page - 1) * pageSize;
    const items = sorted.slice(start, start + pageSize);

    return HttpResponse.json({ items, total: filtered.length, page, pageSize });
  }),

  http.post(`${env.apiBaseUrl}/classifications/:id/decision`, async ({ request, params }) => {
    await randomLatency();
    await applyForceDelay(request);
    const forcedError = forcedErrorResponse(request);
    if (forcedError) return forcedError;

    const body = (await request.json().catch(() => ({}))) as DecisionRequestBody;
    const item = classificationsStore.find((candidate) => candidate.id === params.id);
    if (!item) return notFound();

    const now = new Date().toISOString();
    const nextAuditEntry = (action: string, detail: string): AuditEntry => ({
      id: `${item.id}_audit_${item.auditTrail.length + 1}`,
      at: now,
      actor: "reviewer@hs-copilot.test",
      action,
      detail,
    });

    if (body.action === "approve") {
      item.status = "approved";
      item.updatedAt = now;
      item.auditTrail.push(
        nextAuditEntry("approved", `Approved suggested code ${item.suggestedCode}.`),
      );
    } else {
      // Reject/override/request_info/undo aren't exercised by any UI yet
      // (that's the Detail task) — record the action without guessing at
      // status transitions no consumer has specified.
      item.auditTrail.push(
        nextAuditEntry(body.action ?? "unknown", `Action "${body.action}" recorded.`),
      );
    }

    return HttpResponse.json(item);
  }),

  http.delete(`${env.apiBaseUrl}/classifications/:id`, async ({ request, params }) => {
    await randomLatency();
    await applyForceDelay(request);
    const forcedError = forcedErrorResponse(request);
    if (forcedError) return forcedError;

    const index = classificationsStore.findIndex((candidate) => candidate.id === params.id);
    if (index === -1) return notFound();

    classificationsStore.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
