import { z } from "zod";
import { importCodeLength, isValidHsCode } from "@/entities/classification";
import type { Jurisdiction } from "@/entities/classification";

export type DecisionInput =
  | { id: string; action: "approve"; code?: string }
  | { id: string; action: "reject"; reason: string }
  | { id: string; action: "override"; code: string; reason: string }
  | { id: string; action: "request_info"; assigneeId: string; note?: string }
  | { id: string; action: "undo" };

export const rejectFormSchema = z.object({
  reason: z.string().trim().min(1, "Enter a reason for rejecting this classification."),
});
export type RejectFormValues = z.infer<typeof rejectFormSchema>;

export function createOverrideFormSchema(currentCode: string, jurisdiction: Jurisdiction) {
  const lengthMessage = `Enter a valid ${importCodeLength(jurisdiction)} digit code for this destination.`;
  return z.object({
    code: z
      .string()
      .trim()
      .min(1, lengthMessage)
      .refine((value) => isValidHsCode(value, jurisdiction), lengthMessage)
      .refine((value) => value !== currentCode, "Choose a different code than the current one."),
    reason: z.string().trim().min(1, "Enter a reason for the override."),
  });
}
export type OverrideFormValues = z.infer<ReturnType<typeof createOverrideFormSchema>>;

export const requestInfoFormSchema = z.object({
  assigneeId: z.string().trim().min(1, "Select who should follow up."),
  note: z.string().trim().optional(),
});
export type RequestInfoFormValues = z.infer<typeof requestInfoFormSchema>;

/** Maps a failed zod parse to one error message per field, keyed by the first path segment. */
export function fieldErrorsFrom(result: z.ZodSafeParseResult<unknown>): Record<string, string> {
  if (result.success) return {};

  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0]);
    if (!(key in errors)) errors[key] = issue.message;
  }
  return errors;
}
