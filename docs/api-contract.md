# API contract (draft, frontend view)

Base path `/api/v1`. The NestJS/FastAPI backend will implement this. When it changes: update this file first, then zod schemas in `entities/*/model`, then MSW handlers. Errors: `{ "error": { "code": string, "message": string, "details"?: unknown } }`. Lists: `{ "items": T[], "total": number, "page": number, "pageSize": number }`.

## Endpoints

| Method                      | Path                                      | Purpose                                                                |
| --------------------------- | ----------------------------------------- | ---------------------------------------------------------------------- |
| GET                         | /health                                   | cold-start check (200 `{status:"ok"}`)                                 |
| POST                        | /auth/sign-in, /auth/sign-up, /auth/reset | session                                                                |
| GET                         | /me                                       | current user + workspaces                                              |
| GET                         | /classifications                          | query: `search, status[], confidenceBand[], page, pageSize, sort`      |
| POST                        | /classifications                          | create + start agent run -> `{classificationId, agentRunId}`           |
| GET                         | /classifications/:id                      | detail incl. candidates, evidence, auditTrail                          |
| POST                        | /classifications/:id/decision             | body `{action:'approve'                                                | 'reject' | 'override' | 'request_info' | 'undo', code?, reason?, assigneeId?, note?}` |
| DELETE                      | /classifications/:id                      | delete (undo handled client-side within a grace window or via restore) |
| GET                         | /agent-runs/:id                           | poll steps (SSE later)                                                 |
| POST                        | /agent-runs/:id/answer                    | `{optionIndex}` answers the clarifying question                        |
| POST                        | /batches                                  | multipart CSV + `{mapping, jurisdiction}`                              |
| GET                         | /batches/:id, /batches/:id/items          | progress and rows (same filters as classifications)                    |
| POST                        | /batches/:id/pause, /resume               | processing control                                                     |
| POST                        | /batches/:id/bulk-approve                 | `{minConfidence}`                                                      |
| GET / POST / PATCH / DELETE | /members, /members/invite, /members/:id   | team                                                                   |
| GET / PUT                   | /review-rules                             | review rules                                                           |
| GET                         | /evaluation/summary                       | methodology numbers (flag `isSample`)                                  |
| GET                         | /export/classifications                   | CSV                                                                    |

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
