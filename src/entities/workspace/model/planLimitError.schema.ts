import { z } from "zod";

export const planLimitReasonSchema = z.enum([
  "classifications",
  "batch_uploads",
  "batch_rows",
  "seats",
  "feature",
]);
export type PlanLimitReason = z.infer<typeof planLimitReasonSchema>;

export const planLimitDetailsSchema = z.object({
  reason: planLimitReasonSchema,
  limit: z.number(),
  used: z.number(),
});
export type PlanLimitDetails = z.infer<typeof planLimitDetailsSchema>;
