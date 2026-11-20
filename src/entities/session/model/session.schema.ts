import { z } from "zod";

export const sessionSchema = z.object({
  userId: z.string(),
  email: z.string(),
  workspaceId: z.string(),
  name: z.string().optional(),
  workspaceName: z.string().optional(),
  // UI-only gating (Members/Review rules read-only for non-admins) - the
  // real backend must enforce this server-side too, see docs/api-contract.md.
  role: z.enum(["admin", "reviewer", "analyst"]).optional(),
});

export type Session = z.infer<typeof sessionSchema>;
