import { useQuery } from "@tanstack/react-query";
import { http, parseResponse } from "@/shared/api";
import { workspaceSettingsSchema } from "../model/workspaceSettings.schema";
import { workspaceSettingsKeys } from "./workspaceSettings.keys";

export function useWorkspaceSettings() {
  return useQuery({
    queryKey: workspaceSettingsKeys.detail(),
    queryFn: async () => {
      const data = await http.get("/workspace");
      return parseResponse(workspaceSettingsSchema, data);
    },
  });
}
