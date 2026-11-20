export interface ReviewRulesFixture {
  highlightAbove: number;
  requireReviewBelow: number;
  requireClarifyingQuestion: boolean;
  requireOverrideReason: boolean;
  secondApproverChapters: string[];
}

function createReviewRulesFixture(): ReviewRulesFixture {
  return {
    highlightAbove: 90,
    requireReviewBelow: 80,
    requireClarifyingQuestion: true,
    requireOverrideReason: true,
    // Off by default - the five chapters below are the available options
    // (SG-8), not a preselected list.
    secondApproverChapters: [],
  };
}

export const reviewRulesStore: ReviewRulesFixture = createReviewRulesFixture();

export function resetReviewRulesStore(): void {
  Object.assign(reviewRulesStore, createReviewRulesFixture());
}
