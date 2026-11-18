import type { AgentRun, AgentRunQuestion, AgentRunStep } from "@/pages/classify-new";
import type { AuditEntry, Candidate, Classification, Evidence } from "@/entities/classification";
import { classificationsStore } from "./classifications.fixtures";

const QUESTION: AgentRunQuestion = {
  text: "Is the product’s principal function fully described above?",
  options: [
    { label: "Yes", hint: "The description covers its primary use" },
    { label: "No", hint: "The product has another important function" },
    { label: "I’m not sure", hint: "Continue with lower confidence" },
  ],
};

const SEARCH_DETAIL = "Compared candidate headings based on material, construction, and use.";
const NOTES_ACTIVE_DETAIL = "Reviewing chapter and explanatory notes.";
const NOTES_PAUSED_DETAIL = "Paused for a clarifying detail.";
const NOTES_DONE_DETAIL = "Reviewed chapter and explanatory notes.";
const RANK_WAITING_DETAIL = "Waiting";
const RANK_ACTIVE_DETAIL = "Ranking classification candidates.";
const RANK_DONE_DETAIL = "Ranked classification candidates.";

/** Run progress is a small phase machine, advanced one step per request: no
 * client timer ever drives it, matching the contract note on GET /agent-runs/:id. */
type RunPhase = 0 | 1 | 2 | 3 | 4 | 5;

interface RunState {
  id: string;
  classificationId: string;
  description: string;
  phase: RunPhase;
}

const runsById = new Map<string, RunState>();

let runCounter = 0;
function nextRunId(): string {
  runCounter += 1;
  return `run_${runCounter}`;
}

function stepsForPhase(phase: RunPhase, description: string): AgentRunStep[] {
  return [
    {
      id: "extract",
      title: "Extract product attributes",
      detail: description,
      state: phase >= 1 ? "done" : "waiting",
    },
    {
      id: "search",
      title: "Search tariff headings",
      detail: SEARCH_DETAIL,
      state: phase === 1 ? "active" : phase >= 2 ? "done" : "waiting",
    },
    {
      id: "notes",
      title: "Apply heading notes",
      detail:
        phase === 2
          ? NOTES_ACTIVE_DETAIL
          : phase === 3
            ? NOTES_PAUSED_DETAIL
            : phase >= 4
              ? NOTES_DONE_DETAIL
              : RANK_WAITING_DETAIL,
      state: phase === 2 ? "active" : phase === 3 ? "paused" : phase >= 4 ? "done" : "waiting",
    },
    {
      id: "rank",
      title: "Rank candidates",
      detail:
        phase === 4 ? RANK_ACTIVE_DETAIL : phase >= 5 ? RANK_DONE_DETAIL : RANK_WAITING_DETAIL,
      state: phase === 4 ? "active" : phase >= 5 ? "done" : "waiting",
    },
  ];
}

function buildAgentRun(run: RunState): AgentRun {
  return {
    id: run.id,
    classificationId: run.classificationId,
    steps: stepsForPhase(run.phase, run.description),
    question: run.phase === 3 ? QUESTION : undefined,
  };
}

interface Heuristic {
  keywords: string[];
  code: string;
  alternatives: [string, string];
  subject: string;
}

const CODE_HEURISTICS: Heuristic[] = [
  {
    keywords: ["plastic", "polymer", "silicone"],
    code: "3926.90",
    alternatives: ["3924.10", "3923.10"],
    subject: "Plastic articles",
  },
  {
    keywords: ["steel", "metal", "aluminum", "aluminium"],
    code: "7326.90",
    alternatives: ["7323.93", "7325.99"],
    subject: "Metal articles",
  },
  {
    keywords: ["cotton", "textile", "fabric", "wool", "nylon"],
    code: "6307.90",
    alternatives: ["6302.60", "6117.80"],
    subject: "Textile articles",
  },
  {
    keywords: ["electronic", "bluetooth", "battery", "charger", "earbud", "speaker", "led"],
    code: "8517.62",
    alternatives: ["8518.30", "8504.40"],
    subject: "Electronic devices",
  },
  {
    keywords: ["wood", "oak", "timber"],
    code: "4419.90",
    alternatives: ["9403.60", "4421.99"],
    subject: "Wooden articles",
  },
];

const DEFAULT_HEURISTIC: Heuristic = {
  keywords: [],
  code: "4202.92",
  alternatives: ["3926.90", "6307.90"],
  subject: "the submitted product",
};

function pickHeuristic(material: string | undefined, intendedUse: string | undefined): Heuristic {
  const haystack = `${material ?? ""} ${intendedUse ?? ""}`.toLowerCase();
  return (
    CODE_HEURISTICS.find((entry) => entry.keywords.some((kw) => haystack.includes(kw))) ??
    DEFAULT_HEURISTIC
  );
}

export interface CreateClassificationInput {
  description: string;
  attributes: { material?: string; intendedUse?: string; origin?: string };
  jurisdiction: Classification["jurisdiction"];
}

/** Builds the full record up front (same shape the detail page reads), so
 * only the audit trail and timestamp change once the run completes. */
function buildClassification(id: string, input: CreateClassificationInput): Classification {
  const { description, attributes, jurisdiction } = input;
  const heuristic = pickHeuristic(attributes.material, attributes.intendedUse);
  const chapter = heuristic.code.split(".")[0];
  const subject = heuristic.subject;
  const now = new Date().toISOString();

  const candidates: Candidate[] = [
    {
      code: heuristic.code,
      title: subject,
      confidence: 88,
      reasoning: [
        {
          title: "Product description",
          body: `The description establishes the product as ${subject.toLowerCase()}.`,
        },
        {
          title: "Heading coverage",
          body: `Heading ${chapter} directly covers its principal material and use.`,
        },
      ],
    },
    {
      code: heuristic.alternatives[0],
      title: `${subject} (alternative)`,
      confidence: 70,
      reasoning: [],
    },
    {
      code: heuristic.alternatives[1],
      title: `${subject} (alternative)`,
      confidence: 61,
      reasoning: [],
    },
  ];

  const evidence: Evidence[] = [
    {
      kind: "tariff_text",
      title: `HTS heading ${chapter}`,
      reference: `HTS heading ${chapter}`,
      excerpt: `${subject} described by its material, construction, and principal function under subheading ${heuristic.code}.`,
    },
    {
      kind: "tariff_text",
      title: "GRI 1 and 6",
      reference: "GRI 1 and 6",
      excerpt:
        "General Rules of Interpretation 1 and 6 govern classification by heading text and subheading comparison.",
    },
    {
      kind: "ruling",
      title: `${subject} ruling`,
      reference: `HQ ${heuristic.code.replace(".", "")}-26`,
      excerpt: `A materially similar ${subject.toLowerCase()} was classified under ${heuristic.code} after review of its essential character and principal use.`,
    },
  ];

  const auditTrail: AuditEntry[] = [
    {
      id: `${id}_audit_1`,
      at: now,
      actor: "AI agent",
      action: "created",
      detail: "Classification research started.",
    },
  ];

  return {
    id,
    workspaceId: "workspace_mock_1",
    description,
    attributes,
    jurisdiction,
    suggestedCode: heuristic.code,
    overridden: false,
    confidence: candidates[0].confidence,
    status: "needs_review",
    candidates,
    evidence,
    auditTrail,
    createdAt: now,
    updatedAt: now,
    createdBy: "reviewer@hs-copilot.test",
  };
}

let classificationCounter = 0;
function nextClassificationId(): string {
  classificationCounter += 1;
  return `cls_new_${classificationCounter}`;
}

export function createRunAndClassification(input: CreateClassificationInput): {
  classificationId: string;
  agentRunId: string;
} {
  const classificationId = nextClassificationId();
  const classification = buildClassification(classificationId, input);
  classificationsStore.push(classification);

  const agentRunId = nextRunId();
  runsById.set(agentRunId, {
    id: agentRunId,
    classificationId,
    description: input.description,
    phase: 0,
  });

  return { classificationId, agentRunId };
}

function completeClassification(classificationId: string): void {
  const item = classificationsStore.find((candidate) => candidate.id === classificationId);
  if (!item) return;

  const now = new Date().toISOString();
  item.updatedAt = now;
  item.auditTrail.push({
    id: `${item.id}_audit_${item.auditTrail.length + 1}`,
    at: now,
    actor: "AI agent",
    action: "research_completed",
    detail: `Research completed with ${item.evidence.length} supporting sources.`,
  });
}

/** Advances the run one transition and returns its new state, or `undefined`
 * if the id is unknown (the page maps that to the Run not found state). */
export function pollAgentRun(id: string): AgentRun | undefined {
  const run = runsById.get(id);
  if (!run) return undefined;

  if (run.phase === 0) run.phase = 1;
  else if (run.phase === 1) run.phase = 2;
  else if (run.phase === 2) run.phase = 3;
  else if (run.phase === 4) {
    run.phase = 5;
    completeClassification(run.classificationId);
  }
  // phase 3 (paused on a question) and phase 5 (complete) are idempotent rests.

  return buildAgentRun(run);
}

export type AnswerResult =
  { ok: true; run: AgentRun } | { ok: false; code: "no_question_open" | "invalid_option" };

export function answerAgentRun(id: string, optionIndex: number): AnswerResult | undefined {
  const run = runsById.get(id);
  if (!run) return undefined;

  if (run.phase !== 3) return { ok: false, code: "no_question_open" };
  if (!Number.isInteger(optionIndex) || optionIndex < 0 || optionIndex >= QUESTION.options.length) {
    return { ok: false, code: "invalid_option" };
  }

  run.phase = 4;
  return { ok: true, run: buildAgentRun(run) };
}

/** Test-only: clears in-memory run state between test files. */
export function resetAgentRunsStore(): void {
  runsById.clear();
  runCounter = 0;
  classificationCounter = 0;
}
