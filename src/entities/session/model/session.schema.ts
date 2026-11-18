import { z } from "zod";

export const sessionSchema = z.object({
  userId: z.string(),
  email: z.string(),
  workspaceId: z.string(),
  name: z.string().optional(),
  workspaceName: z.string().optional(),
});

export type Session = z.infer<typeof sessionSchema>;
