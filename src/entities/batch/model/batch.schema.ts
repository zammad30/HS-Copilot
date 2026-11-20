import { z } from "zod";
import { jurisdictionSchema } from "@/entities/classification/@x/batch";

export const batchStatusSchema = z.enum(["processing", "throttled", "paused", "complete"]);
export type BatchStatus = z.infer<typeof batchStatusSchema>;

export const batchSchema = z.object({
  id: z.string(),
  filename: z.string(),
  total: z.number(),
  classified: z.number(),
  status: batchStatusSchema,
  jurisdiction: jurisdictionSchema,
  startedAt: z.string(),
});
export type Batch = z.infer<typeof batchSchema>;
