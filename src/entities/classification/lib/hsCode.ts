import type { Jurisdiction } from "../model/classification.schema";
import { getDestination } from "../model/destinations";

const ALLOWED_CHARACTERS = /^\d[\d .-]*$/;

/** Validates an import code for the given destination: digits are counted and
 * separators (dot, space, hyphen) are ignored, so formatting is cosmetic. */
export function isValidHsCode(code: string, jurisdiction: Jurisdiction): boolean {
  const trimmed = code.trim();
  if (!ALLOWED_CHARACTERS.test(trimmed)) return false;
  const digitCount = trimmed.replace(/\D/g, "").length;
  return getDestination(jurisdiction).allowedLengths.includes(digitCount);
}
