import type { Classification } from "../model/classification.schema";

export function effectiveCode(
  classification: Pick<Classification, "finalCode" | "suggestedCode">,
): string {
  return classification.finalCode ?? classification.suggestedCode;
}
