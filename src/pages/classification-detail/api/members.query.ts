import { useQuery } from "@tanstack/react-query";
import { http, parseResponse } from "@/shared/api";
import { membersListResponseSchema } from "./members.schema";
import { membersKeys } from "./members.keys";

// Page-local per the brief (CD-9): only this page's "Assign to" select needs
// the member list, so there is no entities/member slice yet. Promote this
// query to an entity if Settings -> Members needs the same data later.
export function useMembers() {
  return useQuery({
    queryKey: membersKeys.list(),
    queryFn: async () => {
      const data = await http.get("/members");
      return parseResponse(membersListResponseSchema, data);
    },
  });
}
