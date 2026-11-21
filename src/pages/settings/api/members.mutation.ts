import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http, parseResponse } from "@/shared/api";
import { memberSchema, memberKeys } from "@/entities/member";
import type { Member, MemberRole, MembersListResponse } from "@/entities/member";
import { parsePlanLimitError, workspaceKeys } from "@/entities/workspace";

// Page-local per docs/architecture.md rule 7: Settings is the only consumer
// of these writes today. Each updates entities/member's cached list directly
// (rather than invalidating and waiting on a refetch) so classification-detail's
// "Assign to" select sees the change too, without an extra round trip.

function upsertMember(current: MembersListResponse | undefined, member: Member) {
  if (!current) return current;
  const exists = current.items.some((item) => item.id === member.id);
  const items = exists
    ? current.items.map((item) => (item.id === member.id ? member : item))
    : [...current.items, member];
  return { ...current, items, total: items.length };
}

export function useInviteMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { email: string; role: MemberRole }) => {
      const data = await http.post("/members/invite", input);
      return parseResponse(memberSchema, data);
    },
    onSuccess: (member) => {
      queryClient.setQueryData<MembersListResponse>(memberKeys.list(), (current) =>
        upsertMember(current, member),
      );
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.detail() });
    },
    // A seats refusal means the usage on screen was stale.
    onError: (error) => {
      if (parsePlanLimitError(error)) {
        void queryClient.invalidateQueries({ queryKey: workspaceKeys.detail() });
      }
    },
  });
}

export function useUpdateMemberRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, role }: { id: string; role: MemberRole }) => {
      const data = await http.patch(`/members/${id}`, { role });
      return parseResponse(memberSchema, data);
    },
    onSuccess: (member) => {
      queryClient.setQueryData<MembersListResponse>(memberKeys.list(), (current) =>
        upsertMember(current, member),
      );
    },
  });
}

export function useRemoveMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => http.delete(`/members/${id}`),
    onSuccess: (_response, id) => {
      queryClient.setQueryData<MembersListResponse>(memberKeys.list(), (current) => {
        if (!current) return current;
        const items = current.items.filter((item) => item.id !== id);
        return { ...current, items, total: items.length };
      });
      void queryClient.invalidateQueries({ queryKey: workspaceKeys.detail() });
    },
  });
}
