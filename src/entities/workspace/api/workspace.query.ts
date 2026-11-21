import { useQuery } from "@tanstack/react-query";
import { http, parseResponse } from "@/shared/api";
import { workspaceSchema } from "../model/workspace.schema";
import { workspaceKeys } from "./workspace.keys";

export function useWorkspace() {
  return useQuery({
    queryKey: workspaceKeys.detail(),
    queryFn: async () => {
      const data = await http.get("/workspace");
      return parseResponse(workspaceSchema, data);
    },
  });
}
