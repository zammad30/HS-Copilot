import { z } from "zod";

export const planIdSchema = z.enum(["free", "solo", "team"]);
export type PlanId = z.infer<typeof planIdSchema>;

export const planLimitsSchema = z.object({
  classifications: z.object({
    limit: z.number(),
    period: z.enum(["lifetime", "month"]),
  }),
  seats: z.number(),
  batch: z.object({
    uploadsPerMonth: z.number(),
    maxRows: z.number(),
  }),
  secondApprover: z.boolean(),
  auditRetentionDays: z.number(),
});
export type PlanLimits = z.infer<typeof planLimitsSchema>;

export const planSchema = z.object({
  id: planIdSchema,
  name: z.string(),
  priceMonthlyCents: z.number(),
  limits: planLimitsSchema,
  isSample: z.boolean(),
});
export type Plan = z.infer<typeof planSchema>;

export const planListResponseSchema = z.object({
  items: z.array(planSchema),
});
export type PlanListResponse = z.infer<typeof planListResponseSchema>;

export const planUsageSchema = z.object({
  classificationsUsed: z.number(),
  batchUploadsUsed: z.number(),
  seatsUsed: z.number(),
  periodEnd: z.string().optional(),
});
export type PlanUsage = z.infer<typeof planUsageSchema>;
