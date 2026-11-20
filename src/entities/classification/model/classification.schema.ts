import { z } from "zod";

export const statusSchema = z.enum(["approved", "rejected", "needs_review", "pending"]);
export type Status = z.infer<typeof statusSchema>;

export const jurisdictionSchema = z.enum(["US_HTS", "EU_CN", "UK_UKGT"]);
export type Jurisdiction = z.infer<typeof jurisdictionSchema>;

export const decisionActionSchema = z.enum([
  "approve",
  "reject",
  "override",
  "request_info",
  "undo",
]);
export type DecisionAction = z.infer<typeof decisionActionSchema>;

export const candidateSchema = z.object({
  code: z.string(),
  title: z.string(),
  confidence: z.number(),
  reasoning: z.array(z.object({ title: z.string(), body: z.string() })),
});
export type Candidate = z.infer<typeof candidateSchema>;

export const evidenceSchema = z.object({
  kind: z.enum(["tariff_text", "ruling"]),
  title: z.string(),
  reference: z.string(),
  excerpt: z.string(),
  sourceUrl: z.string().optional(),
  isSample: z.boolean().optional(),
});
export type Evidence = z.infer<typeof evidenceSchema>;

export const auditEntrySchema = z.object({
  id: z.string(),
  at: z.string(),
  actor: z.string(),
  action: z.string(),
  detail: z.string(),
});
export type AuditEntry = z.infer<typeof auditEntrySchema>;

export const modelInfoSchema = z.object({
  version: z.string(),
  isSample: z.boolean().optional(),
});
export type ModelInfo = z.infer<typeof modelInfoSchema>;

export const classificationSchema = z.object({
  id: z.string(),
  workspaceId: z.string(),
  description: z.string(),
  attributes: z.object({
    material: z.string().optional(),
    intendedUse: z.string().optional(),
    origin: z.string().optional(),
  }),
  jurisdiction: jurisdictionSchema,
  suggestedCode: z.string(),
  finalCode: z.string().optional(),
  overridden: z.boolean(),
  confidence: z.number(),
  status: statusSchema,
  candidates: z.array(candidateSchema),
  evidence: z.array(evidenceSchema),
  auditTrail: z.array(auditEntrySchema),
  createdAt: z.string(),
  updatedAt: z.string(),
  createdBy: z.string(),
  model: modelInfoSchema.optional(),
  expiresAt: z.string(),
});
export type Classification = z.infer<typeof classificationSchema>;

export const classificationListResponseSchema = z.object({
  items: z.array(classificationSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});
export type ClassificationListResponse = z.infer<typeof classificationListResponseSchema>;
