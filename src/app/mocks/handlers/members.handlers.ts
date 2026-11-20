import { http, HttpResponse } from "msw";
import { env } from "@/shared/config";
import { applyForceDelay, forcedErrorResponse, randomLatency } from "../scenarios";
import { membersStore } from "../fixtures/members.fixtures";
import type { MemberFixture } from "../fixtures/members.fixtures";

interface InviteRequestBody {
  email?: unknown;
  role?: unknown;
}

interface RoleUpdateBody {
  role?: unknown;
}

const VALID_ROLES = new Set(["admin", "reviewer", "analyst"]);

// Mirrors entities/session's MOCK_SESSION.email. Not imported from
// @/entities/session for the same reason classifications.handlers.ts avoids
// it: that barrel also re-exports useSignOut, which pulls in the real
// @/shared/api at module-evaluation time, ahead of any per-test vi.mock.
const actorEmail = "reviewer@hs-copilot.test";

function notFound(): Response {
  return HttpResponse.json(
    { error: { code: "not_found", message: "Member not found" } },
    { status: 404 },
  );
}

function validationError(message: string, details?: Record<string, string>): Response {
  return HttpResponse.json(
    { error: { code: "validation_error", message, details } },
    { status: 422 },
  );
}

function countAdmins(): number {
  return membersStore.filter((member) => member.role === "admin").length;
}

function nameFromEmail(email: string): string {
  const localPart = email.split("@")[0] ?? "New member";
  return localPart
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(" ");
}

export const membersHandlers = [
  http.get(`${env.apiBaseUrl}/members`, async ({ request }) => {
    await randomLatency();
    await applyForceDelay(request);
    const forcedError = forcedErrorResponse(request);
    if (forcedError) return forcedError;

    return HttpResponse.json({
      items: membersStore,
      total: membersStore.length,
      page: 1,
      pageSize: membersStore.length,
    });
  }),

  http.post(`${env.apiBaseUrl}/members/invite`, async ({ request }) => {
    await randomLatency();
    await applyForceDelay(request);
    const forcedError = forcedErrorResponse(request);
    if (forcedError) return forcedError;

    const body = (await request.json().catch(() => ({}))) as InviteRequestBody;
    const email = typeof body.email === "string" ? body.email.trim() : "";
    const role = typeof body.role === "string" ? body.role : "analyst";

    if (!email.includes("@")) {
      return validationError("Enter a valid email address.", {
        email: "Enter a valid email address.",
      });
    }
    if (!VALID_ROLES.has(role)) {
      return validationError("Unsupported role.", { role: "Unsupported role." });
    }

    // Idempotent: re-inviting (or "Resend invite" on) an existing email
    // returns that member unchanged instead of creating a duplicate.
    const existing = membersStore.find(
      (member) => member.email.toLowerCase() === email.toLowerCase(),
    );
    if (existing) return HttpResponse.json(existing);

    const newMember: MemberFixture = {
      id: `member_${Date.now()}`,
      name: nameFromEmail(email),
      email,
      role: role as MemberFixture["role"],
      status: "invited",
    };
    membersStore.push(newMember);
    return HttpResponse.json(newMember, { status: 201 });
  }),

  http.patch(`${env.apiBaseUrl}/members/:id`, async ({ request, params }) => {
    await randomLatency();
    await applyForceDelay(request);
    const forcedError = forcedErrorResponse(request);
    if (forcedError) return forcedError;

    const member = membersStore.find((candidate) => candidate.id === params.id);
    if (!member) return notFound();

    const body = (await request.json().catch(() => ({}))) as RoleUpdateBody;
    const role = typeof body.role === "string" ? body.role : undefined;
    if (!role || !VALID_ROLES.has(role)) {
      return validationError("Unsupported role.", { role: "Unsupported role." });
    }

    if (member.role === "admin" && role !== "admin" && countAdmins() <= 1) {
      return validationError("You can't demote the last admin.");
    }

    member.role = role as MemberFixture["role"];
    return HttpResponse.json(member);
  }),

  http.delete(`${env.apiBaseUrl}/members/:id`, async ({ request, params }) => {
    await randomLatency();
    await applyForceDelay(request);
    const forcedError = forcedErrorResponse(request);
    if (forcedError) return forcedError;

    const index = membersStore.findIndex((candidate) => candidate.id === params.id);
    if (index === -1) return notFound();
    const member = membersStore[index];

    if (member.email.toLowerCase() === actorEmail) {
      return validationError("You can't remove yourself.");
    }
    if (member.role === "admin" && countAdmins() <= 1) {
      return validationError("You can't remove the last admin.");
    }

    membersStore.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
