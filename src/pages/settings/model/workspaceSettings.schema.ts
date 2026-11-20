import { z } from "zod";
import { jurisdictionSchema } from "@/entities/classification";

export const workspaceSettingsSchema = z.object({
  id: z.string(),
  name: z.string(),
  defaultJurisdiction: jurisdictionSchema,
});
export type WorkspaceSettings = z.infer<typeof workspaceSettingsSchema>;
