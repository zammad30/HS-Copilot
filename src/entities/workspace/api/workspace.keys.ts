export const workspaceKeys = {
  all: ["workspace"] as const,
  detail: () => [...workspaceKeys.all, "detail"] as const,
  plans: () => ["plans"] as const,
};
