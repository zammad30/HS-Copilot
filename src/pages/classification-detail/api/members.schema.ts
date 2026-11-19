import { z } from "zod";

export const memberSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string(),
  role: z.enum(["admin", "reviewer", "analyst"]),
  status: z.enum(["active", "invited"]),
  lastActiveAt: z.string().optional(),
});
export type Member = z.infer<typeof memberSchema>;

export const membersListResponseSchema = z.object({
  items: z.array(memberSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});
export type MembersListResponse = z.infer<typeof membersListResponseSchema>;
