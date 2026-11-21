import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http, parseResponse } from "@/shared/api";
import { workspaceSchema, workspaceKeys } from "@/entities/workspace";
import type { Workspace } from "@/entities/workspace";

export function useUpdateWorkspaceSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Partial<Pick<Workspace, "name" | "defaultJurisdiction">>) => {
      const data = await http.patch("/workspace", input);
      return parseResponse(workspaceSchema, data);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(workspaceKeys.detail(), updated);
    },
  });
}
