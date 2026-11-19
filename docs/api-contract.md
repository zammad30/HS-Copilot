# API contract (draft, frontend view)

Base path `/api/v1`. The NestJS/FastAPI backend will implement this. When it changes: update this file first, then zod schemas in `entities/*/model`, then MSW handlers. Errors: `{ "error": { "code": string, "message": string, "details"?: unknown } }`. Lists: `{ "items": T[], "total": number, "page": number, "pageSize": number }`.

## Endpoints

| Method                      | Path                                      | Purpose                                                                                                                                                                                                                                                                                                                       |
| --------------------------- | ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| GET                         | /health                                   | cold-start check (200 `{status:"ok"}`)                                                                                                                                                                                                                                                                                        |
| POST                        | /auth/sign-in, /auth/sign-up, /auth/reset | session                                                                                                                                                                                                                                                                                                                       |
| POST                        | /auth/sign-out                            | ends the session; 204 no body                                                                                                                                                                                                                                                                                                 |
| GET                         | /me                                       | current user + workspaces                                                                                                                                                                                                                                                                                                     |
| GET                         | /classifications                          | query: `search, status[], confidenceBand[], page, pageSize, sort` — array params are comma-separated, e.g. `?status=needs_review,pending`                                                                                                                                                                                     |
| POST                        | /classifications                          | body `{description: string, attributes: {material?: string, intendedUse?: string, origin?: string}, jurisdiction: Jurisdiction}`; creates + starts an agent run -> `{classificationId, agentRunId}`                                                                                                                           |
| GET                         | /classifications/:id                      | detail incl. candidates, evidence, auditTrail; unknown id -> 404 `not_found`                                                                                                                                                                                                                                                  |
| POST                        | /classifications/:id/decision             | body `{action:'approve'                                                                                                                                                                                                                                                                                                       | 'reject' | 'override' | 'request_info' | 'undo', code?, reason?, assigneeId?, note?}`. **200** returns the updated `Classification`. Validation: `reject`requires non-empty`reason`; `override`requires`code`(valid HS format) and non-empty`reason`; `request_info`requires`assigneeId`; `approve`optionally carries`code`(omitted = the suggested code);`undo`needs no body. Violations -> 422`{error:{code:"validation_error", details}}`. See Decision rules below. |
| DELETE                      | /classifications/:id                      | delete (undo handled client-side within a grace window or via restore)                                                                                                                                                                                                                                                        |
| GET                         | /agent-runs/:id                           | poll steps (SSE later); returns the `AgentRun` shape below. Each poll advances the in-memory mock run one transition — not a client timer. A run is complete when every step is `"done"`; it is waiting on the user when `question` is present (polling should stop while a question is open). Unknown id -> 404 `not_found`. |
| POST                        | /agent-runs/:id/answer                    | body `{optionIndex: number}` answers the clarifying question; returns the updated `AgentRun` with the question cleared and the run resumed. Out-of-range `optionIndex`, or no question open, -> 409/422 standard error shape.                                                                                                 |
| POST                        | /batches                                  | multipart CSV + `{mapping, jurisdiction}`                                                                                                                                                                                                                                                                                     |
| GET                         | /batches/:id, /batches/:id/items          | progress and rows (same filters as classifications)                                                                                                                                                                                                                                                                           |
| POST                        | /batches/:id/pause, /resume               | processing control                                                                                                                                                                                                                                                                                                            |
| POST                        | /batches/:id/bulk-approve                 | `{minConfidence}`                                                                                                                                                                                                                                                                                                             |
| GET / POST / PATCH / DELETE | /members, /members/invite, /members/:id   | team                                                                                                                                                                                                                                                                                                                          |
| GET / PUT                   | /review-rules                             | review rules                                                                                                                                                                                                                                                                                                                  |
| GET                         | /evaluation/summary                       | methodology numbers (flag `isSample`)                                                                                                                                                                                                                                                                                         |
| GET                         | /export/classifications                   | CSV                                                                                                                                                                                                                                                                                                                           |

## Types (zod schemas are the source; these are the shapes)

```ts
type Status = "approved" | "rejected" | "needs_review" | "pending";
type Jurisdiction = "US_HTS" | "EU_CN" | "UK_UKGT";
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
interface ReviewRules {
  highlightAbove: number;
  requireReviewBelow: number;
  requireClarifyingQuestion: boolean;
  requireOverrideReason: boolean;
  secondApproverChapters: string[];
  auditRetention: "12m" | "24m" | "7y" | "indefinite";
}
interface Session {
  userId: string;
  email: string;
  workspaceId: string;
  name?: string;
  workspaceName?: string;
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

Business rules the UI relies on: cannot remove or demote yourself or the last admin; override requires a reason when `requireOverrideReason`; `overridden` items keep `status: 'approved'` with `finalCode`.

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
