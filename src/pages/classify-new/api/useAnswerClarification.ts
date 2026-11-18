import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http, parseResponse } from "@/shared/api";
import { agentRunSchema } from "../model/agentRun.schema";
import { agentRunKeys } from "./agentRuns.keys";

// Page-local (architecture rule 7): only this page answers a run's clarifying question.
export function useAnswerClarification(runId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (optionIndex: number) => {
      const data = await http.post(`/agent-runs/${runId}/answer`, { optionIndex });
      return parseResponse(agentRunSchema, data);
    },
    onSuccess: (run) => {
      queryClient.setQueryData(agentRunKeys.detail(runId), run);
    },
  });
}
