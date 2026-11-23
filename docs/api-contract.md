# API contract (draft, frontend view)

Base path `/api/v1`. The NestJS/FastAPI backend will implement this. When it changes: update this file first, then zod schemas in `entities/*/model`, then MSW handlers. Errors: `{ "error": { "code": string, "message": string, "details"?: unknown } }`. Lists: `{ "items": T[], "total": number, "page": number, "pageSize": number }`.

## Endpoints

| Method                      | Path                                      | Purpose                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GET                         | /health                                   | cold-start check (200 `{status:"ok"}`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| GET                         | /plans                                    | public, no auth; returns `{items: Plan[]}` - a fixed list, no paging, unlike other list endpoints                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| GET / PATCH                 | /workspace                                | workspace defaults and plan state: `{id, name, defaultJurisdiction, plan, limits, usage}`; PATCH accepts a partial of `{name, defaultJurisdiction}` only (`defaultJurisdiction` is the default destination; each classification or batch can choose another) - the plan cannot be changed through the real API                                                                                                                                                                                                                                                           |
| POST                        | /auth/sign-in, /auth/sign-up, /auth/reset | session                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| POST                        | /auth/sign-out                            | ends the session; 204 no body                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| GET / PATCH                 | /me                                       | current user + workspaces; PATCH accepts `{name}`, returns `{name}`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| GET                         | /classifications                          | query: `search, status[], confidenceBand[], page, pageSize, sort, expiring` - array params are comma-separated, e.g. `?status=needs_review,pending`. `expiring=true` returns only records whose `expiresAt` falls within the expiring window (see Expiry below); the same flag with `pageSize=1` backs a banner count via `total`. A record past `expiresAt` is absent from every list                                                                                                                                                                                   |
| POST                        | /classifications                          | body `{description: string, attributes: {material?: string, intendedUse?: string, origin?: string}, jurisdiction: Jurisdiction}`; creates + starts an agent run -> `{classificationId, agentRunId}`. Refused with 403 `plan_limit_reached` (reason `classifications`) if the workspace plan's classification limit is already used; refusal creates nothing and leaves usage unchanged                                                                                                                                                                                   |
| GET                         | /classifications/:id                      | detail incl. candidates, evidence, auditTrail; unknown id, or an id past `expiresAt`, -> 404 `not_found`                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| POST                        | /classifications/:id/decision             | body `{action:'approve'                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | 'reject' | 'override' | 'request_info' | 'undo', code?, reason?, assigneeId?, note?}`. **200** returns the updated `Classification`. Validation: `reject`requires non-empty`reason`; `override`requires`code`(valid HS format) and non-empty`reason`; `request_info`requires`assigneeId`; `approve`optionally carries`code`(omitted = the suggested code);`undo`needs no body. Violations -> 422`{error:{code:"validation_error", details}}`. Unknown id, or an id past `expiresAt`, -> 404 `not_found`. See Decision rules below. |
| DELETE                      | /classifications/:id                      | delete (undo handled client-side within a grace window or via restore); unknown id, or an id past `expiresAt`, -> 404 `not_found`                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| GET                         | /agent-runs/:id                           | poll steps (SSE later); returns the `AgentRun` shape below. Each poll advances the in-memory mock run one transition - not a client timer. A run is complete when every step is `"done"`; it is waiting on the user when `question` is present (polling should stop while a question is open). Unknown id -> 404 `not_found`.                                                                                                                                                                                                                                            |
| POST                        | /agent-runs/:id/answer                    | body `{optionIndex: number}` answers the clarifying question; returns the updated `AgentRun` with the question cleared and the run resumed. Out-of-range `optionIndex`, or no question open, -> 409/422 standard error shape.                                                                                                                                                                                                                                                                                                                                            |
| POST                        | /batches                                  | multipart CSV + `{mapping, jurisdiction}`. Refused with 403 `plan_limit_reached` before anything is created: reason `feature` if the plan allows no batch uploads at all, `batch_uploads` if this period's upload count is used up, `batch_rows` if the file's row count exceeds the plan's `maxRows`, `classifications` if the row count exceeds the plan's remaining classification quota. On success, increments both `batchUploadsUsed` (by 1) and `classificationsUsed` (by the row count) - batch rows count toward the classification limit when the batch starts |
| GET                         | /batches/:id, /batches/:id/items          | progress and rows (same filters as classifications); `/items` never returns a row past its `expiresAt`                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| POST                        | /batches/:id/pause, /resume               | processing control                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| POST                        | /batches/:id/bulk-approve                 | `{minConfidence}`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| GET / POST / PATCH / DELETE | /members, /members/invite, /members/:id   | team. `/members/invite` is checked for seats only after the idempotent existing-email short-circuit (an existing member, including a resend, never counts against seats); otherwise refused with 403 `plan_limit_reached` (reason `seats`) when members plus pending invites already meet the plan's seat limit                                                                                                                                                                                                                                                          |
| GET / PUT                   | /review-rules                             | review rules. `PUT` is refused with 403 `plan_limit_reached` (reason `feature`) when `secondApproverChapters` is non-empty and the plan has no `secondApprover`                                                                                                                                                                                                                                                                                                                                                                                                          |
| GET                         | /evaluation/summary                       | methodology numbers (flag `isSample`)                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| GET                         | /export/classifications                   | CSV                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

## Types (zod schemas are the source; these are the shapes)

```ts
type Status = "approved" | "rejected" | "needs_review" | "pending";
type Jurisdiction = "US_HTS" | "EU_CN" | "UK_UKGT" | "CA_CCT" | "AU_WT" | "TR_GTIP";
interface Classification {
  id: string;
  workspaceId: string;
  description: string;
  attributes: { material?: string; intendedUse?: string; origin?: string };
  jurisdiction: Jurisdiction;
  suggestedCode: string;
  finalCode?: string;
  overridden: boolean;
  confidence: number;
  status: Status;
  candidates: Candidate[];
  evidence: Evidence[];
  auditTrail: AuditEntry[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  model?: { version: string; isSample?: boolean };
  expiresAt: string;
  path?: PathLevel[];
}
interface PathLevel {
  level: "chapter" | "heading" | "subheading" | "national";
  code: string;
  title: string;
  isSample?: boolean;
}
interface Candidate {
  code: string;
  title: string;
  confidence: number;
  reasoning: { title: string; body: string }[];
}
interface Evidence {
  kind: "tariff_text" | "ruling";
  title: string;
  reference: string;
  excerpt: string;
  sourceUrl?: string;
  isSample?: boolean;
}
interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  action: string;
  detail: string;
}
interface AgentRun {
  id: string;
  classificationId: string;
  steps: {
    id: string;
    title: string;
    detail: string;
    state: "done" | "active" | "paused" | "waiting";
  }[];
  question?: { text: string; options: { label: string; hint: string }[] };
}
interface Batch {
  id: string;
  filename: string;
  total: number;
  classified: number;
  status: "processing" | "throttled" | "paused" | "complete";
  jurisdiction: Jurisdiction;
  startedAt: string;
}
interface Member {
  id: string;
  name: string;
  email: string;
  role: "admin" | "reviewer" | "analyst";
  status: "active" | "invited";
  lastActiveAt?: string;
}
type PlanId = "free" | "solo" | "team";
interface PlanLimits {
  classifications: { limit: number; period: "lifetime" | "month" };
  seats: number;
  batch: { uploadsPerMonth: number; maxRows: number }; // 0 and 0 = no batch access
  secondApprover: boolean;
  auditRetentionDays: number;
}
interface Plan {
  id: PlanId;
  name: string;
  priceMonthlyCents: number;
  limits: PlanLimits;
  isSample: boolean;
}
interface PlanUsage {
  classificationsUsed: number;
  batchUploadsUsed: number;
  seatsUsed: number;
  periodEnd?: string; // monthly plans only
}
interface ReviewRules {
  highlightAbove: number;
  requireReviewBelow: number;
  requireClarifyingQuestion: boolean;
  requireOverrideReason: boolean;
  secondApproverChapters: string[];
}
interface Session {
  userId: string;
  email: string;
  workspaceId: string;
  name?: string;
  workspaceName?: string;
  role?: Member["role"];
}
interface SignInRequest {
  email: string;
  password: string;
}
interface SignUpRequest {
  name: string;
  email: string;
  password: string;
}
interface ResetRequest {
  email: string;
}
interface AuthResponse {
  session: Session;
}
interface ResetResponse {
  ok: true;
}
interface EvaluationSummary {
  top3Recall: number;
  top1ExactMatch: number;
  reviewedTestCases: number;
  humanControlledRate: number;
  htsSnapshot: string;
  lastUpdatedAt: string;
  chapterRecall: { code: string; name: string; recallPercent: number }[];
  isSample: boolean;
}
```

Business rules the UI relies on: cannot remove or demote yourself or the last admin; override requires a reason when `requireOverrideReason`; `overridden` items keep `status: 'approved'` with `finalCode`. `POST /members/invite` is idempotent: inviting an email that already belongs to a member returns that existing member unchanged (200) instead of creating a duplicate - the same call backs the Members tab's "Resend invite" action. `Session.role` only gates the UI (Members and Review rules read-only for non-admins); the real backend must enforce this server-side too, since a client can't be trusted to self-restrict.

## Destinations

`Jurisdiction` is the destination customs territory: the import market whose tariff schedule applies. The field name stays `jurisdiction` everywhere in the API; the UI calls it "Destination". Each classification and each batch chooses its own destination. `workspace.defaultJurisdiction` (same six values) is only the default destination, the starting value for new classifications and batches; each one can choose another, and choosing another never changes the workspace default.

| Id        | UI label       | Import code length (digits)         |
| --------- | -------------- | ----------------------------------- |
| `US_HTS`  | United States  | 10                                  |
| `EU_CN`   | European Union | 10 (8, the CN level, also accepted) |
| `UK_UKGT` | United Kingdom | 10                                  |
| `CA_CCT`  | Canada         | 10                                  |
| `AU_WT`   | Australia      | 10                                  |
| `TR_GTIP` | Turkey         | 12                                  |

Digits only; separators (dots, spaces, hyphens) are ignored when counting. The first 6 digits are the international HS code, shared by all destinations; the remaining digits are national and differ by destination. A code supplied to `override` (and an `approve` code) is validated against the length rule of the classification's own destination.

Backend phase: only destinations with a verified data source will return real codes; the others stay sample only. Nothing in the frontend depends on this yet.

Mock rule: a sample code has the real first 6 digits of the mock result and placeholder national digits (for example `8518.30.0000`). The placeholder digits are sample data (`isSample` on the model and evidence as today) and must never be presented as real tariff codes.

## Classification path

`Classification.path` is optional and lists the hierarchy of the effective code (`finalCode ?? suggestedCode`) from the chapter down to the national line, in that order: `chapter` (2 digits), `heading` (4), `subheading` (6), `national` (the full import code). Each level has its `code` and a `title`; the last level's `code` equals the effective code. The server recomputes the path whenever a decision changes the effective code (`approve` with a code, `override`, `reject`, `undo`), so every response that returns a full `Classification` (`GET /classifications/:id` and `POST /classifications/:id/decision`) carries a path that matches its current code. The list endpoint does not need to include it. A record with no known path omits the field and the UI renders nothing for the block, never an error. `isSample: true` on a level marks placeholder data (for example the national digits of a sample code, see Destinations).

## Decision rules

The server (and the mock) applies exactly these transitions for `POST /classifications/:id/decision`:

| Action         | Result                                                                                                                                                                                                                                                                                                                      |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `approve`      | `status: approved`, `finalCode = code ?? suggestedCode`, `overridden: false`                                                                                                                                                                                                                                                |
| `override`     | `status: approved`, `finalCode = code`, `overridden: true` (stays `approved`, never `rejected`)                                                                                                                                                                                                                             |
| `reject`       | `status: rejected`, `finalCode` cleared, `overridden: false`                                                                                                                                                                                                                                                                |
| `request_info` | `status: pending`                                                                                                                                                                                                                                                                                                           |
| `undo`         | restores `status`, `finalCode` and `overridden` to their values immediately before the most recently applied `approve`/`override`/`reject`/`request_info` decision on this record; only one step of history is kept, so a second `undo` in a row with no decision in between returns 409 `{error:{code:"nothing_to_undo"}}` |

Every decision appends exactly one `AuditEntry` (`id`, `at` = server now, `actor` = the authenticated user, `action`, `detail`) to `auditTrail` and returns it in the response. `AuditEntry.action` is a stable code the UI maps to a title: `created`, `details_confirmed`, `research_completed`, `approved`, `overridden`, `rejected`, `info_requested`, `undone`.

## Plans

`GET /plans` is public (no auth) and returns a fixed catalog - `{items: Plan[]}`, with no paging, unlike every other list endpoint. The real backend has no "API access" field; the Pricing page shows "Planned" as static copy for that row, never a value from this data.

Sample catalog (`isSample: true` on every plan):

| Plan   | Price / month | Classifications | Seats | Batch                          | Second approver | Audit retention |
| ------ | ------------- | --------------- | ----- | ------------------------------ | --------------- | --------------- |
| `free` | $0            | 5 lifetime      | 1     | none                           | no              | 30 days         |
| `solo` | $14.99        | 500 / month     | 1     | 3 uploads/month, 50 rows max   | no              | 365 days        |
| `team` | $29.99        | 1300 / month    | 5     | 10 uploads/month, 500 rows max | yes             | 730 days        |

`GET /workspace` reflects the workspace's current plan as `plan: PlanId`, `limits: PlanLimits` (that plan's limits, denormalized onto the workspace response so the UI never has to cross-reference `/plans`), and `usage: PlanUsage`. The plan cannot be changed through the real API - see Mock-only below for how the mock switches it.

## Expiry

Every `Classification` carries `expiresAt`, computed as `createdAt` plus the workspace plan's `auditRetentionDays`. Once past `expiresAt` a record (and its audit trail) is deleted: it is absent from every list (`GET /classifications`, `GET /batches/:id/items`) and `GET /classifications/:id`, the decision endpoint, and `DELETE /classifications/:id` all return 404 `not_found` for it.

`GET /classifications?expiring=true` returns only records whose `expiresAt` falls within the expiring window, `N = min(30, auditRetentionDays / 3)` days from now (10 days on Free, 30 days on Solo and Team - without this cap, every Free record would always count as expiring, since 30/3 = 10 but a naive "within auditRetentionDays" window would include everything). A banner showing how many records are expiring soon uses this same flag with `pageSize=1` and reads `total` - there is no separate endpoint for the count.

## Limit errors

A plan-limit violation returns 403 with a dedicated error code, instead of the generic error shape used elsewhere:

```json
{
  "error": {
    "code": "plan_limit_reached",
    "message": string,
    "details": { "reason": string, "limit": number, "used": number }
  }
}
```

`reason` is one of `"classifications" | "batch_uploads" | "batch_rows" | "seats" | "feature"`. Every check happens before anything is created or changed, so a refusal leaves usage counters unchanged:

| Endpoint                | Checks (in order)                                                                                                                                                                                                                                                                                         |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /classifications` | `classifications` once `classificationsUsed >= limits.classifications.limit`                                                                                                                                                                                                                              |
| `POST /batches`         | `feature` if the plan allows no batch uploads at all (`uploadsPerMonth` and `maxRows` both 0); else `batch_uploads` if this period's uploads are used up; else `batch_rows` if the file's row count exceeds `maxRows`; else `classifications` if the row count exceeds the remaining classification quota |
| `POST /members/invite`  | `seats` once members plus pending invites meet `limits.seats` - checked only after the idempotent existing-email case (an existing member, including a "Resend invite", never counts against seats)                                                                                                       |
| `PUT /review-rules`     | `feature` when `secondApproverChapters` is non-empty and the plan's `secondApprover` is `false`                                                                                                                                                                                                           |

## Usage rules

`classificationsUsed` counts creations in the current period (lifetime for the Free plan). Batch rows count toward `classificationsUsed` when the batch starts (`POST /batches`, on success), not as each row finishes processing; the same success also increments `batchUploadsUsed` by 1. `seatsUsed` counts members and pending invites together. Deleting a classification never reduces usage. After a downgrade, `used` may exceed the new plan's `limit` - the UI should not assume `used <= limit`.

## Mock-only

Not part of the real API. `PUT /__mock/plan` with body `{plan: PlanId}` switches the mock workspace's current plan, so every limit, usage figure and expiry calculation on `GET /workspace` and the classification endpoints immediately reflects the new plan. The mock's default plan is `team`.
