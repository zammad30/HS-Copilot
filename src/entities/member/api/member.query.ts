import { useQuery } from "@tanstack/react-query";
import { http, parseResponse } from "@/shared/api";
import { membersListResponseSchema } from "../model/member.schema";
import { memberKeys } from "./member.keys";

// Promoted from pages/classification-detail/api: Settings' Members tab is now
// a second consumer, alongside classification-detail's "Assign to" select.
export function useMembers() {
  return useQuery({
    queryKey: memberKeys.list(),
    queryFn: async () => {
      const data = await http.get("/members");
      return parseResponse(membersListResponseSchema, data);
    },
  });
}
