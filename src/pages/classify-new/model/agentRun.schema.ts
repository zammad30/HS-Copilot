import { z } from "zod";

export const agentRunStepStateSchema = z.enum(["done", "active", "paused", "waiting"]);
export type AgentRunStepState = z.infer<typeof agentRunStepStateSchema>;

export const agentRunStepSchema = z.object({
  id: z.string(),
  title: z.string(),
  detail: z.string(),
  state: agentRunStepStateSchema,
});
export type AgentRunStep = z.infer<typeof agentRunStepSchema>;

export const agentRunQuestionOptionSchema = z.object({
  label: z.string(),
  hint: z.string(),
});
export type AgentRunQuestionOption = z.infer<typeof agentRunQuestionOptionSchema>;

export const agentRunQuestionSchema = z.object({
  text: z.string(),
  options: z.array(agentRunQuestionOptionSchema),
});
export type AgentRunQuestion = z.infer<typeof agentRunQuestionSchema>;

export const agentRunSchema = z.object({
  id: z.string(),
  classificationId: z.string(),
  steps: z.array(agentRunStepSchema),
  question: agentRunQuestionSchema.optional(),
});
export type AgentRun = z.infer<typeof agentRunSchema>;

export const createClassificationResponseSchema = z.object({
  classificationId: z.string(),
  agentRunId: z.string(),
});
export type CreateClassificationResponse = z.infer<typeof createClassificationResponseSchema>;
