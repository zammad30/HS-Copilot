import type { Jurisdiction } from "../model/classification.schema";

const LABELS: Record<Jurisdiction, string> = {
  US_HTS: "United States",
  EU_CN: "European Union",
  UK_UKGT: "United Kingdom",
};

export function jurisdictionLabel(jurisdiction: Jurisdiction): string {
  return LABELS[jurisdiction];
}
