import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http, parseResponse } from "@/shared/api";
import { workspaceSettingsSchema } from "../model/workspaceSettings.schema";
import type { WorkspaceSettings } from "../model/workspaceSettings.schema";
import { workspaceSettingsKeys } from "./workspaceSettings.keys";

export function useUpdateWorkspaceSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: Partial<Pick<WorkspaceSettings, "name" | "defaultJurisdiction">>) => {
      const data = await http.patch("/workspace", input);
      return parseResponse(workspaceSettingsSchema, data);
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(workspaceSettingsKeys.detail(), updated);
    },
  });
}
