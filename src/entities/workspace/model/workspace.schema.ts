import { z } from "zod";
import { jurisdictionSchema } from "@/entities/classification/@x/workspace";
import { planIdSchema, planLimitsSchema, planUsageSchema } from "./plans.schema";

export const workspaceSchema = z.object({
  id: z.string(),
  name: z.string(),
  defaultJurisdiction: jurisdictionSchema,
  plan: planIdSchema,
  limits: planLimitsSchema,
  usage: planUsageSchema,
});
export type Workspace = z.infer<typeof workspaceSchema>;
