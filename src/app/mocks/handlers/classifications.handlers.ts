import { http, HttpResponse } from "msw";
import { env } from "@/shared/config";
import { decisionActionSchema, effectiveCode, isValidHsCode } from "@/entities/classification";
import type { AuditEntry, DecisionAction } from "@/entities/classification";
import { applyForceDelay, forcedErrorResponse, randomLatency } from "../scenarios";
import {
  classificationsStore,
  clearPreviousState,
  getPreviousState,
  setPreviousState,
} from "../fixtures/classifications.fixtures";
import { membersStore } from "../fixtures/members.fixtures";
import { applyClassificationListParams } from "../support/classificationQuery";
import { applyApproveTransition } from "../support/decisionTransitions";
import { isExpired, isExpiringSoon, withExpiresAt } from "../support/classificationExpiry";

interface DecisionRequestBody {
  action?: DecisionAction;
  code?: string;
  reason?: string;
  assigneeId?: string;
  note?: string;
}

function notFound(): Response {
  return HttpResponse.json(
    { error: { code: "not_found", message: "Classification not found" } },
    { status: 404 },
  );
}

function validationError(details: Record<string, string>): Response {
  return HttpResponse.json({ error: { code: "validation_error", details } }, { status: 422 });
}

function nothingToUndo(): Response {
  return HttpResponse.json(
    { error: { code: "nothing_to_undo", message: "There is no decision to undo." } },
    { status: 409 },
  );
}

// Mirrors entities/session's MOCK_SESSION.name. Not imported from
// @/entities/session: that barrel also re-exports useSignOut, which pulls in
// the real @/shared/api at module-evaluation time. Since this handler is
// wired into the globally-registered MSW server (tests/setup.ts), a runtime
// import here would eagerly load the real @/shared/api in every test file
// before a test's own vi.mock("@/shared/api") can intercept it, breaking
// unrelated tests such as useSignOut.test.tsx.
const actorName = "Sam Rivera";

export const classificationsHandlers = [
  http.get(`${env.apiBaseUrl}/classifications`, async ({ request }) => {
    await randomLatency();
    await applyForceDelay(request);
    const forcedError = forcedErrorResponse(request);
    if (forcedError) return forcedError;

    const url = new URL(request.url);
    const expiringOnly = url.searchParams.get("expiring") === "true";

    let candidates = classificationsStore.filter((item) => !isExpired(item));
    if (expiringOnly) candidates = candidates.filter((item) => isExpiringSoon(item));

    const { items, total, page, pageSize } = applyClassificationListParams(
      candidates.map(withExpiresAt),
      url,
    );

    return HttpResponse.json({ items, total, page, pageSize });
  }),

  http.get(`${env.apiBaseUrl}/classifications/:id`, async ({ request, params }) => {
    await randomLatency();
    await applyForceDelay(request);
    const forcedError = forcedErrorResponse(request);
    if (forcedError) return forcedError;

    const item = classificationsStore.find((candidate) => candidate.id === params.id);
    if (!item || isExpired(item)) return notFound();
    return HttpResponse.json(withExpiresAt(item));
  }),

  http.post(`${env.apiBaseUrl}/classifications/:id/decision`, async ({ request, params }) => {
    await randomLatency();
    await applyForceDelay(request);
    const forcedError = forcedErrorResponse(request);
    if (forcedError) return forcedError;

    const body = (await request.json().catch(() => ({}))) as DecisionRequestBody;
    const item = classificationsStore.find((candidate) => candidate.id === params.id);
    if (!item || isExpired(item)) return notFound();

    if (!decisionActionSchema.safeParse(body.action).success) {
      return validationError({ action: "Unsupported decision action." });
    }

    const now = new Date().toISOString();
    const nextAuditEntry = (action: string, detail: string): AuditEntry => ({
      id: `${item.id}_audit_${item.auditTrail.length + 1}`,
      at: now,
      actor: actorName,
      action,
      detail,
    });
    const snapshotBeforeChange = () =>
      setPreviousState(item.id, {
        status: item.status,
        finalCode: item.finalCode,
        overridden: item.overridden,
      });

    switch (body.action) {
      case "approve": {
        if (body.code !== undefined && !isValidHsCode(body.code, item.jurisdiction)) {
          return validationError({ code: "Enter a valid code for this destination." });
        }
        snapshotBeforeChange();
        applyApproveTransition(item, body.code, actorName);
        break;
      }

      case "reject": {
        const reason = body.reason?.trim();
        if (!reason) {
          return validationError({ reason: "Enter a reason for rejecting this classification." });
        }
        snapshotBeforeChange();
        item.status = "rejected";
        item.finalCode = undefined;
        item.overridden = false;
        item.updatedAt = now;
        item.auditTrail.push(
          nextAuditEntry("rejected", `Rejected by ${actorName}. Reason: ${reason}`),
        );
        break;
      }

      case "override": {
        const code = body.code?.trim();
        const reason = body.reason?.trim();
        if (!code || !isValidHsCode(code, item.jurisdiction)) {
          return validationError({ code: "Enter a valid code for this destination." });
        }
        const previousCode = effectiveCode(item);
        if (code === previousCode) {
          return validationError({ code: "Choose a different code than the current one." });
        }
        if (!reason) {
          return validationError({ reason: "Enter a reason for the override." });
        }
        snapshotBeforeChange();
        item.status = "approved";
        item.finalCode = code;
        item.overridden = true;
        item.updatedAt = now;
        item.auditTrail.push(
          nextAuditEntry("overridden", `${previousCode} changed to ${code}. Reason: ${reason}`),
        );
        break;
      }

      case "request_info": {
        const assigneeId = body.assigneeId;
        if (!assigneeId) {
          return validationError({ assigneeId: "Select who should follow up." });
        }
        const assignee = membersStore.find((member) => member.id === assigneeId);
        snapshotBeforeChange();
        item.status = "pending";
        item.updatedAt = now;
        const noteSuffix = body.note?.trim() ? ` Note: ${body.note.trim()}` : "";
        item.auditTrail.push(
          nextAuditEntry(
            "info_requested",
            `Assigned to ${assignee?.name ?? "a reviewer"} for follow-up.${noteSuffix}`,
          ),
        );
        break;
      }

      case "undo": {
        const snapshot = getPreviousState(item.id);
        if (!snapshot) return nothingToUndo();
        item.status = snapshot.status;
        item.finalCode = snapshot.finalCode;
        item.overridden = snapshot.overridden;
        item.updatedAt = now;
        clearPreviousState(item.id);
        item.auditTrail.push(nextAuditEntry("undone", `${actorName} undid the previous decision.`));
        break;
      }
    }

    return HttpResponse.json(withExpiresAt(item));
  }),

  http.delete(`${env.apiBaseUrl}/classifications/:id`, async ({ request, params }) => {
    await randomLatency();
    await applyForceDelay(request);
    const forcedError = forcedErrorResponse(request);
    if (forcedError) return forcedError;

    const index = classificationsStore.findIndex((candidate) => candidate.id === params.id);
    if (index === -1 || isExpired(classificationsStore[index])) return notFound();

    classificationsStore.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
