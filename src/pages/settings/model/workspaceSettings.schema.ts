import { z } from "zod";
import { jurisdictionSchema } from "@/entities/classification";
import { planIdSchema, planLimitsSchema, planUsageSchema } from "./plans.schema";

export const workspaceSettingsSchema = z.object({
  id: z.string(),
  name: z.string(),
  defaultJurisdiction: jurisdictionSchema,
  plan: planIdSchema,
  limits: planLimitsSchema,
  usage: planUsageSchema,
});
export type WorkspaceSettings = z.infer<typeof workspaceSettingsSchema>;
