import type {
  AuditEntry,
  Candidate,
  Classification,
  Evidence,
  Status,
} from "@/entities/classification";
import { mockNow } from "../support/mockNow";
import { sampleCodeFor } from "../support/destinationCodes";

/** The store holds classifications without `expiresAt`: that field is
 * derived at read time from the current plan's retention, never stored
 * (see src/app/mocks/support/classificationExpiry.ts). */
export type StoredClassification = Omit<Classification, "expiresAt">;

function isoHoursAgo(hours: number): string {
  return new Date(mockNow() - hours * 60 * 60 * 1000).toISOString();
}

interface SeedInput {
  id: string;
  description: string;
  code: string;
  confidence: number;
  status: Status;
  /** 0-2 alternative codes; most records carry two, two edge-case records fewer. */
  alternatives: string[];
  subject: string;
  createdHoursAgo: number;
  updatedHoursAgo: number;
  overridden?: boolean;
  finalCode?: string;
  /** Edge case: a classification whose research found no comparable ruling. */
  includeRuling?: boolean;
}

const ALTERNATIVE_REASONING: { title: string; body: string }[][] = [
  [
    {
      title: "Narrower heading coverage",
      body: "This subheading covers a narrower slice of the product and does not match its full description.",
    },
    {
      title: "Weaker precedent support",
      body: "Fewer comparable reviewed rulings were found supporting this subheading.",
    },
  ],
  [
    {
      title: "Essential character mismatch",
      body: "The product's essential character points away from this heading's principal use.",
    },
    {
      title: "Section note conflict",
      body: "A section or chapter note directs materially similar goods elsewhere.",
    },
  ],
];

/** Mirrors the Figma export's `sampleProduct()` factory, filling the full
 * contract shape (candidates/evidence/auditTrail) from a few seed inputs so
 * every record stays internally consistent. */
function buildClassification(input: SeedInput): StoredClassification {
  const {
    id,
    description,
    code: baseCode,
    confidence,
    status,
    alternatives: baseAlternatives,
    subject,
    createdHoursAgo,
    updatedHoursAgo,
    overridden = false,
    finalCode: baseFinalCode,
    includeRuling = true,
  } = input;
  // Every seed record is a US_HTS one. Seeds carry the real 6 digit HS code;
  // the national digits are placeholders (sample data, see the api contract).
  const jurisdiction = "US_HTS";
  const code = sampleCodeFor(baseCode, jurisdiction);
  const alternatives = baseAlternatives.map((alt) => sampleCodeFor(alt, jurisdiction));
  const finalCode = baseFinalCode ? sampleCodeFor(baseFinalCode, jurisdiction) : undefined;
  const chapter = baseCode.split(".")[0];

  const candidates: Candidate[] = [
    {
      code,
      title: subject,
      confidence,
      reasoning: [
        {
          title: "Product description",
          body: `The description establishes the product as ${subject.toLowerCase()}.`,
        },
        {
          title: "Heading coverage",
          body: `Heading ${chapter} directly covers its principal material and use.`,
        },
        {
          title: "Section and chapter notes",
          body: "The relevant section and chapter notes do not direct it to another heading.",
        },
        {
          title: "Comparable rulings",
          body: `Comparable reviewed merchandise supports subheading ${code}.`,
        },
      ],
    },
    ...alternatives.map((altCode, index) => ({
      code: altCode,
      title: `${subject} (alternative)`,
      confidence: Math.max(confidence - 18 * (index + 1), 5),
      reasoning: ALTERNATIVE_REASONING[index % ALTERNATIVE_REASONING.length],
    })),
  ];

  const evidence: Evidence[] = [
    {
      kind: "tariff_text",
      title: `HTS heading ${chapter}`,
      reference: `HTS heading ${chapter}`,
      excerpt: `${subject} described by its material, construction, and principal function under subheading ${code}.`,
    },
    {
      kind: "tariff_text",
      title: "GRI 1 and 6",
      reference: "GRI 1 and 6",
      excerpt:
        "General Rules of Interpretation 1 and 6 govern classification by heading text and subheading comparison.",
    },
    ...(includeRuling
      ? [
          {
            kind: "ruling" as const,
            title: `${subject} ruling`,
            reference: `HQ ${baseCode.replace(".", "")}-26`,
            excerpt: `A materially similar ${subject.toLowerCase()} was classified under ${code} after review of its essential character and principal use.`,
            isSample: true,
          },
        ]
      : []),
  ];

  const auditTrail: AuditEntry[] = [
    {
      id: `${id}_audit_1`,
      at: isoHoursAgo(createdHoursAgo),
      actor: "AI agent",
      action: "created",
      detail: "Created after automated research.",
    },
    {
      id: `${id}_audit_2`,
      at: isoHoursAgo(createdHoursAgo - 0.02),
      actor: "AI agent",
      action: "research_completed",
      detail: `${candidates.length === 1 ? "One candidate" : `${candidates.length} candidates`} ranked from ${evidence.length} sources.`,
    },
  ];
  if (overridden) {
    auditTrail.push({
      id: `${id}_audit_3`,
      at: isoHoursAgo(updatedHoursAgo),
      actor: "reviewer@hs-copilot.test",
      action: "overridden",
      detail: `${code} changed to ${finalCode}. Reason: better matches the product's principal use.`,
    });
  } else if (status === "approved") {
    auditTrail.push({
      id: `${id}_audit_3`,
      at: isoHoursAgo(updatedHoursAgo),
      actor: "reviewer@hs-copilot.test",
      action: "approved",
      detail: `reviewer@hs-copilot.test approved ${code}.`,
    });
  } else if (status === "rejected") {
    auditTrail.push({
      id: `${id}_audit_3`,
      at: isoHoursAgo(updatedHoursAgo),
      actor: "reviewer@hs-copilot.test",
      action: "rejected",
      detail: "Rejected by reviewer@hs-copilot.test. Reason: does not match the suggested heading.",
    });
  } else if (status === "pending") {
    auditTrail.push({
      id: `${id}_audit_3`,
      at: isoHoursAgo(updatedHoursAgo),
      actor: "reviewer@hs-copilot.test",
      action: "info_requested",
      detail: "Assigned to Mina Patel for follow-up.",
    });
  }

  return {
    id,
    workspaceId: "workspace_mock_1",
    description,
    attributes: { intendedUse: subject },
    jurisdiction,
    suggestedCode: code,
    finalCode: overridden ? finalCode : undefined,
    overridden,
    confidence,
    status,
    candidates,
    evidence,
    auditTrail,
    createdAt: isoHoursAgo(createdHoursAgo),
    updatedAt: isoHoursAgo(updatedHoursAgo),
    createdBy: "reviewer@hs-copilot.test",
    model: { version: "hs-copilot-classifier-v1", isSample: true },
  };
}

const SEEDS: SeedInput[] = [
  {
    id: "cls_001",
    description: "Men's 100% cotton knitted crew-neck T-shirt",
    code: "6109.10",
    confidence: 96,
    status: "approved",
    alternatives: ["6109.90", "6110.20"],
    subject: "Knitted cotton apparel",
    createdHoursAgo: 1800,
    updatedHoursAgo: 1772,
    overridden: true,
    finalCode: "6109.90",
  },
  {
    id: "cls_002",
    description: "Wireless Bluetooth earbuds with charging case",
    code: "8518.30",
    confidence: 88,
    status: "needs_review",
    alternatives: ["8518.22", "8527.13"],
    subject: "Wireless earphones",
    createdHoursAgo: 120,
    updatedHoursAgo: 120,
  },
  {
    id: "cls_003",
    description: "Stainless steel vacuum insulated bottle, 750 ml",
    code: "9617.00",
    confidence: 94,
    status: "approved",
    alternatives: ["7323.93", "3924.10"],
    subject: "Vacuum vessels",
    createdHoursAgo: 600,
    updatedHoursAgo: 594,
  },
  {
    id: "cls_004",
    description: "Woven nylon travel backpack, 28 litre",
    code: "4202.92",
    confidence: 72,
    status: "rejected",
    alternatives: ["4202.12", "6307.90"],
    subject: "Travel bags",
    createdHoursAgo: 3600,
    updatedHoursAgo: 3590,
  },
  {
    id: "cls_005",
    description: "Ceramic tableware set, glazed stoneware",
    code: "6912.00",
    confidence: 81,
    status: "pending",
    alternatives: ["6911.10", "6914.90"],
    subject: "Ceramic tableware",
    createdHoursAgo: 7920,
    updatedHoursAgo: 7920,
  },
  {
    id: "cls_006",
    description: "LED desk lamp with adjustable arm",
    code: "9405.21",
    confidence: 91,
    status: "approved",
    alternatives: ["9405.42", "8539.52"],
    subject: "Electric table lamps",
    createdHoursAgo: 336,
    updatedHoursAgo: 329,
  },
  {
    id: "cls_007",
    description: "Roasted Arabica coffee beans, 1 kg",
    code: "0901.21",
    confidence: 93,
    status: "approved",
    alternatives: ["0901.11", "2101.11"],
    subject: "Roasted coffee",
    createdHoursAgo: 1800,
    updatedHoursAgo: 1796,
    // Edge case: research did not find a comparable past ruling.
    includeRuling: false,
  },
  {
    id: "cls_008",
    description: "Women's textile running shoes with rubber sole",
    code: "6404.11",
    confidence: 86,
    status: "needs_review",
    alternatives: ["6404.19", "6402.99"],
    subject: "Sports footwear",
    createdHoursAgo: 8400,
    updatedHoursAgo: 8400,
  },
  {
    id: "cls_009",
    description: "Solid oak dining table, seats six",
    code: "9403.60",
    confidence: 89,
    status: "pending",
    alternatives: ["9403.20", "4419.90"],
    subject: "Wooden furniture",
    createdHoursAgo: 9120,
    updatedHoursAgo: 9120,
  },
  {
    id: "cls_010",
    description: "Monocrystalline photovoltaic solar panel, 450 W",
    code: "8541.43",
    confidence: 95,
    status: "approved",
    alternatives: ["8501.72", "8541.42"],
    subject: "Photovoltaic modules",
    createdHoursAgo: 216,
    updatedHoursAgo: 209,
  },
  {
    id: "cls_011",
    description: "Stackable polypropylene storage bins with lids",
    code: "3924.90",
    confidence: 78,
    status: "needs_review",
    alternatives: ["3923.10", "3926.90"],
    subject: "Plastic household articles",
    createdHoursAgo: 960,
    updatedHoursAgo: 960,
  },
  {
    id: "cls_012",
    description: "Women's woven wool overcoat",
    code: "6201.11",
    confidence: 84,
    status: "pending",
    alternatives: ["6101.10", "6201.20"],
    subject: "Woven wool outerwear",
    createdHoursAgo: 12000,
    updatedHoursAgo: 12000,
  },
  {
    id: "cls_013",
    description: "Moulded silicone smartphone protective case",
    code: "3926.90",
    confidence: 82,
    status: "needs_review",
    alternatives: ["4202.32", "3923.10"],
    subject: "Plastic protective articles",
    createdHoursAgo: 960,
    updatedHoursAgo: 960,
  },
  {
    id: "cls_014",
    description: "Stainless steel kitchen chef's knife, 20 cm",
    code: "8211.92",
    confidence: 97,
    status: "approved",
    // Edge case: research found only one viable candidate.
    alternatives: [],
    subject: "Fixed-blade kitchen knives",
    createdHoursAgo: 48,
    updatedHoursAgo: 44.5,
  },
];

function createClassificationsFixtures(): StoredClassification[] {
  return SEEDS.map(buildClassification);
}

/** Mutable, module-scoped store so approve/delete persist across refetches
 * within a session, mirroring how a real backend would behave. */
export const classificationsStore: StoredClassification[] = createClassificationsFixtures();

interface DecisionSnapshot {
  status: Status;
  finalCode?: string;
  overridden: boolean;
}

/** Mock-only bookkeeping (not part of the contract) so `undo` can restore the
 * state from immediately before the most recently applied decision. */
const previousStates = new Map<string, DecisionSnapshot>();

export function getPreviousState(id: string): DecisionSnapshot | undefined {
  return previousStates.get(id);
}

export function setPreviousState(id: string, snapshot: DecisionSnapshot): void {
  previousStates.set(id, snapshot);
}

export function clearPreviousState(id: string): void {
  previousStates.delete(id);
}

/** Test-only: restores the store to its original 14 seed records. */
export function resetClassificationsStore(): void {
  classificationsStore.splice(0, classificationsStore.length, ...createClassificationsFixtures());
  previousStates.clear();
}
