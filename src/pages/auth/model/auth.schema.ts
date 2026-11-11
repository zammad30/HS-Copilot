import { z } from "zod";

const emailField = z
  .string()
  .trim()
  .max(254, "Enter a valid work email address.")
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "Enter a valid work email address.");

export const signInSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Enter your password."),
});

export const signUpSchema = z.object({
  name: z.string().trim().min(1, "Enter your full name."),
  email: emailField,
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const resetSchema = z.object({
  email: emailField,
});

export type SignInValues = z.infer<typeof signInSchema>;
export type SignUpValues = z.infer<typeof signUpSchema>;
export type ResetValues = z.infer<typeof resetSchema>;

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
