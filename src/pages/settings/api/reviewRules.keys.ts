export const reviewRulesKeys = {
  all: ["reviewRules"] as const,
  detail: () => [...reviewRulesKeys.all, "detail"] as const,
};
