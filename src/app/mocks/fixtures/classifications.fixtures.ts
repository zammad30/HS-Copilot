import type {
  AuditEntry,
  Candidate,
  Classification,
  Evidence,
  Status,
} from "@/entities/classification";

function isoHoursAgo(hours: number): string {
  return new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
}

interface SeedInput {
  id: string;
  description: string;
  code: string;
  confidence: number;
  status: Status;
  alternatives: [string, string];
  subject: string;
  createdHoursAgo: number;
  updatedHoursAgo: number;
  overridden?: boolean;
  finalCode?: string;
}

/** Mirrors the Figma export's `sampleProduct()` factory, filling the full
 * contract shape (candidates/evidence/auditTrail) from a few seed inputs so
 * every record stays internally consistent. */
function buildClassification(input: SeedInput): Classification {
  const {
    id,
    description,
    code,
    confidence,
    status,
    alternatives,
    subject,
    createdHoursAgo,
    updatedHoursAgo,
    overridden = false,
    finalCode,
  } = input;
  const chapter = code.split(".")[0];

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
    {
      code: alternatives[0],
      title: `${subject} (alternative)`,
      confidence: Math.max(confidence - 18, 5),
      reasoning: [],
    },
    {
      code: alternatives[1],
      title: `${subject} (alternative)`,
      confidence: Math.max(confidence - 27, 5),
      reasoning: [],
    },
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
    {
      kind: "ruling",
      title: `${subject} ruling`,
      reference: `HQ ${code.replace(".", "")}-26`,
      excerpt: `A materially similar ${subject.toLowerCase()} was classified under ${code} after review of its essential character and principal use.`,
    },
  ];

  const auditTrail: AuditEntry[] = [
    {
      id: `${id}_audit_1`,
      at: isoHoursAgo(createdHoursAgo),
      actor: "AI agent",
      action: "created",
      detail: "Classification suggested after automated research.",
    },
  ];
  if (overridden) {
    auditTrail.push({
      id: `${id}_audit_2`,
      at: isoHoursAgo(updatedHoursAgo),
      actor: "reviewer@hs-copilot.test",
      action: "overridden",
      detail: `Overridden to ${finalCode}.`,
    });
  } else if (status === "approved") {
    auditTrail.push({
      id: `${id}_audit_2`,
      at: isoHoursAgo(updatedHoursAgo),
      actor: "reviewer@hs-copilot.test",
      action: "approved",
      detail: `Approved suggested code ${code}.`,
    });
  } else if (status === "rejected") {
    auditTrail.push({
      id: `${id}_audit_2`,
      at: isoHoursAgo(updatedHoursAgo),
      actor: "reviewer@hs-copilot.test",
      action: "rejected",
      detail: "Rejected after review.",
    });
  }

  return {
    id,
    workspaceId: "workspace_mock_1",
    description,
    attributes: { intendedUse: subject },
    jurisdiction: "US_HTS",
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
    createdHoursAgo: 30,
    updatedHoursAgo: 2,
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
    createdHoursAgo: 5,
    updatedHoursAgo: 5,
  },
  {
    id: "cls_003",
    description: "Stainless steel vacuum insulated bottle, 750 ml",
    code: "9617.00",
    confidence: 94,
    status: "approved",
    alternatives: ["7323.93", "3924.10"],
    subject: "Vacuum vessels",
    createdHoursAgo: 26,
    updatedHoursAgo: 20,
  },
  {
    id: "cls_004",
    description: "Woven nylon travel backpack, 28 litre",
    code: "4202.92",
    confidence: 72,
    status: "rejected",
    alternatives: ["4202.12", "6307.90"],
    subject: "Travel bags",
    createdHoursAgo: 50,
    updatedHoursAgo: 40,
  },
  {
    id: "cls_005",
    description: "Ceramic tableware set, glazed stoneware",
    code: "6912.00",
    confidence: 81,
    status: "pending",
    alternatives: ["6911.10", "6914.90"],
    subject: "Ceramic tableware",
    createdHoursAgo: 170,
    updatedHoursAgo: 170,
  },
  {
    id: "cls_006",
    description: "LED desk lamp with adjustable arm",
    code: "9405.21",
    confidence: 91,
    status: "approved",
    alternatives: ["9405.42", "8539.52"],
    subject: "Electric table lamps",
    createdHoursAgo: 10,
    updatedHoursAgo: 3,
  },
  {
    id: "cls_007",
    description: "Roasted Arabica coffee beans, 1 kg",
    code: "0901.21",
    confidence: 93,
    status: "approved",
    alternatives: ["0901.11", "2101.11"],
    subject: "Roasted coffee",
    createdHoursAgo: 28,
    updatedHoursAgo: 24,
  },
  {
    id: "cls_008",
    description: "Women's textile running shoes with rubber sole",
    code: "6404.11",
    confidence: 86,
    status: "needs_review",
    alternatives: ["6404.19", "6402.99"],
    subject: "Sports footwear",
    createdHoursAgo: 168,
    updatedHoursAgo: 168,
  },
  {
    id: "cls_009",
    description: "Solid oak dining table, seats six",
    code: "9403.60",
    confidence: 89,
    status: "pending",
    alternatives: ["9403.20", "4419.90"],
    subject: "Wooden furniture",
    createdHoursAgo: 172,
    updatedHoursAgo: 172,
  },
  {
    id: "cls_010",
    description: "Monocrystalline photovoltaic solar panel, 450 W",
    code: "8541.43",
    confidence: 95,
    status: "approved",
    alternatives: ["8501.72", "8541.42"],
    subject: "Photovoltaic modules",
    createdHoursAgo: 8,
    updatedHoursAgo: 1,
  },
  {
    id: "cls_011",
    description: "Stackable polypropylene storage bins with lids",
    code: "3924.90",
    confidence: 78,
    status: "needs_review",
    alternatives: ["3923.10", "3926.90"],
    subject: "Plastic household articles",
    createdHoursAgo: 27,
    updatedHoursAgo: 27,
  },
  {
    id: "cls_012",
    description: "Women's woven wool overcoat",
    code: "6201.11",
    confidence: 84,
    status: "pending",
    alternatives: ["6101.10", "6201.20"],
    subject: "Woven wool outerwear",
    createdHoursAgo: 175,
    updatedHoursAgo: 175,
  },
  {
    id: "cls_013",
    description: "Moulded silicone smartphone protective case",
    code: "3926.90",
    confidence: 82,
    status: "needs_review",
    alternatives: ["4202.32", "3923.10"],
    subject: "Plastic protective articles",
    createdHoursAgo: 26,
    updatedHoursAgo: 26,
  },
  {
    id: "cls_014",
    description: "Stainless steel kitchen chef's knife, 20 cm",
    code: "8211.92",
    confidence: 97,
    status: "approved",
    alternatives: ["8211.91", "8208.30"],
    subject: "Fixed-blade kitchen knives",
    createdHoursAgo: 4,
    updatedHoursAgo: 0.5,
  },
];

function createClassificationsFixtures(): Classification[] {
  return SEEDS.map(buildClassification);
}

/** Mutable, module-scoped store so approve/delete persist across refetches
 * within a session, mirroring how a real backend would behave. */
export const classificationsStore: Classification[] = createClassificationsFixtures();

/** Test-only: restores the store to its original 14 seed records. */
export function resetClassificationsStore(): void {
  classificationsStore.splice(0, classificationsStore.length, ...createClassificationsFixtures());
}
