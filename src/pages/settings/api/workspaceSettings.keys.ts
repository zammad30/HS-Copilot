export const workspaceSettingsKeys = {
  all: ["workspace"] as const,
  detail: () => [...workspaceSettingsKeys.all, "detail"] as const,
};
