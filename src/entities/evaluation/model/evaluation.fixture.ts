import { evaluationSummarySchema } from "./evaluation.schema";

/**
 * Hardcoded until `GET /evaluation/summary` exists (docs/api-contract.md).
 * Field names match that contract shape so swapping in the real query is a rename, not a redesign.
 */
export const evaluationSummary = evaluationSummarySchema.parse({
  top3Recall: 92.4,
  top1ExactMatch: 84.1,
  reviewedTestCases: 3200,
  humanControlledRate: 100,
  htsSnapshot: "US HTS 2026 rev. 12",
  lastUpdatedAt: "7 Nov 2026",
  chapterRecall: [
    { code: "61", name: "Knitted apparel", recallPercent: 94 },
    { code: "85", name: "Electrical equipment", recallPercent: 89 },
    { code: "42", name: "Leather & travel goods", recallPercent: 87 },
    { code: "73", name: "Articles of iron or steel", recallPercent: 85 },
    { code: "39", name: "Plastics", recallPercent: 78 },
  ],
  isSample: true,
});
