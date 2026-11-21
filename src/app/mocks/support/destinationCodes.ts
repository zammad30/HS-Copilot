import { importCodeLength } from "@/entities/classification";
import type { Jurisdiction } from "@/entities/classification";

const PLACEHOLDER_DIGIT = "0";

/** Builds a sample import code for a destination from a real 6 digit HS code
 * (e.g. "8518.30"). The first 6 digits are real; the national digits are
 * placeholders and must never be presented as a real tariff code. */
export function sampleCodeFor(hsCode: string, jurisdiction: Jurisdiction): string {
  const digits = hsCode.replace(/\D/g, "").slice(0, 6);
  const nationalLength = importCodeLength(jurisdiction) - 6;
  const national = PLACEHOLDER_DIGIT.repeat(nationalLength);
  return `${digits.slice(0, 4)}.${digits.slice(4, 6)}.${national}`;
}
