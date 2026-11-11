import { z } from "zod";

// isSample becomes z.boolean() once the real endpoint exists.
export const evaluationSummarySchema = z.object({
  top3Recall: z.number(),
  top1ExactMatch: z.number(),
  reviewedTestCases: z.number(),
  humanControlledRate: z.number(),
  htsSnapshot: z.string(),
  lastUpdatedAt: z.string(),
  chapterRecall: z.array(
    z.object({
      code: z.string(),
      name: z.string(),
      recallPercent: z.number(),
    }),
  ),
  isSample: z.literal(true),
});

export type EvaluationSummary = z.infer<typeof evaluationSummarySchema>;
