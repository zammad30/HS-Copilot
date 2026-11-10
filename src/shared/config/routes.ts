// Route paths from docs/architecture.md. Components must not hard-code paths.
export const routes = {
  landing: "/",
  methodology: "/methodology",
  signIn: "/signin",
  privacy: "/privacy",
  terms: "/terms",
  try: "/try",
  home: "/app",
  classifyNew: "/app/classify/new",
  classificationDetail: (id: string) => `/app/classifications/${id}`,
  batchUpload: "/app/batches/new",
  batchReview: (id: string) => `/app/batches/${id}`,
  library: "/app/library",
  settingsGeneral: "/app/settings/general",
  settingsMembers: "/app/settings/members",
  settingsRules: "/app/settings/rules",
  kit: "/_kit",
} as const;
