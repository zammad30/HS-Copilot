export const agentRunKeys = {
  all: ["agent-runs"] as const,
  detail: (id: string) => [...agentRunKeys.all, "detail", id] as const,
};
