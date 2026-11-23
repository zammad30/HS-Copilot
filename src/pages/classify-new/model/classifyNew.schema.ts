import { z } from "zod";
import type { Jurisdiction } from "@/entities/classification";

// Starting destination while the workspace default is loading or failed to
// load, so the required select never blocks the form.
export const FALLBACK_JURISDICTION: Jurisdiction = "US_HTS";

export const DESCRIPTION_MAX_LENGTH = 1000;

export const classifyNewFormSchema = z.object({
  description: z
    .string()
    .trim()
    .min(1, "Enter a product description.")
    .max(DESCRIPTION_MAX_LENGTH, "Use 1000 characters or fewer."),
  material: z.string().trim().optional(),
  intendedUse: z.string().trim().optional(),
  origin: z.string().trim().optional(),
});
export type ClassifyNewFormValues = z.infer<typeof classifyNewFormSchema>;

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
