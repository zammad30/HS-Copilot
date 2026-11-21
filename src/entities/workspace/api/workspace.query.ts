import { useQuery } from "@tanstack/react-query";
import { http, parseResponse } from "@/shared/api";
import { workspaceSchema } from "../model/workspace.schema";
import { workspaceKeys } from "./workspace.keys";

export interface UseWorkspaceOptions {
  /** Defaults to true. Pass false to skip the request, e.g. when signed out. */
  enabled?: boolean;
}

export function useWorkspace({ enabled = true }: UseWorkspaceOptions = {}) {
  return useQuery({
    queryKey: workspaceKeys.detail(),
    queryFn: async () => {
      const data = await http.get("/workspace");
      return parseResponse(workspaceSchema, data);
    },
    enabled,
  });
}
