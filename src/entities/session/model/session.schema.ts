import { z } from "zod";

export const sessionSchema = z.object({
  userId: z.string(),
  email: z.string(),
  workspaceId: z.string(),
});

export type Session = z.infer<typeof sessionSchema>;
