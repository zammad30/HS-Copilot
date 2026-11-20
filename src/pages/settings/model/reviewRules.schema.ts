import { z } from "zod";

export const auditRetentionSchema = z.enum(["12m", "24m", "7y", "indefinite"]);
export type AuditRetention = z.infer<typeof auditRetentionSchema>;

export const reviewRulesSchema = z.object({
  highlightAbove: z.number(),
  requireReviewBelow: z.number(),
  requireClarifyingQuestion: z.boolean(),
  requireOverrideReason: z.boolean(),
  secondApproverChapters: z.array(z.string()),
  auditRetention: auditRetentionSchema,
});
export type ReviewRules = z.infer<typeof reviewRulesSchema>;

/** SG-8: the five chapters the Figma export hardcodes, kept as the full option list for now. */
export const SECOND_APPROVER_CHAPTER_OPTIONS = [
  { value: "30", label: "Chapter 30 - Pharmaceutical products" },
  { value: "61", label: "Chapter 61 - Apparel and clothing, knitted or crocheted" },
  { value: "84", label: "Chapter 84 - Machinery and mechanical appliances" },
  { value: "85", label: "Chapter 85 - Electrical machinery and equipment" },
  { value: "87", label: "Chapter 87 - Vehicles" },
] as const;

export const AUDIT_RETENTION_OPTIONS: { value: AuditRetention; label: string }[] = [
  { value: "12m", label: "12 months" },
  { value: "24m", label: "24 months" },
  { value: "7y", label: "7 years" },
  { value: "indefinite", label: "Indefinite" },
];
