import { useQuery } from "@tanstack/react-query";
import { http, parseResponse } from "@/shared/api";
import { agentRunSchema } from "../model/agentRun.schema";
import { isRunComplete, needsAnswer } from "../model/agentRun.lib";
import { agentRunKeys } from "./agentRuns.keys";

const POLL_INTERVAL_MS = 1000;

export function useAgentRun(id: string | undefined, options?: { refetchIntervalMs?: number }) {
  const pollInterval = options?.refetchIntervalMs ?? POLL_INTERVAL_MS;

  return useQuery({
    queryKey: agentRunKeys.detail(id ?? ""),
    queryFn: async () => {
      const data = await http.get(`/agent-runs/${id}`);
      return parseResponse(agentRunSchema, data);
    },
    enabled: id !== undefined,
    retry: false,
    refetchInterval: (query) => {
      const run = query.state.data;
      if (!run) return false;
      if (isRunComplete(run) || needsAnswer(run)) return false;
      return pollInterval;
    },
  });
}
