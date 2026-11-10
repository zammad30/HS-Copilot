/**
 * Hardcoded until `entities/evaluation` + `GET /evaluation/summary` exist (docs/api-contract.md).
 * Field names match that future contract shape so swapping in the real query is a rename, not a redesign.
 */
export interface EvaluationSummarySample {
  top3Recall: number;
  top1ExactMatch: number;
  reviewedTestCases: number;
  humanControlledRate: number;
  isSample: true;
}

export const evaluationSample: EvaluationSummarySample = {
  top3Recall: 92.4,
  top1ExactMatch: 84.1,
  reviewedTestCases: 3200,
  humanControlledRate: 100,
  isSample: true,
};
