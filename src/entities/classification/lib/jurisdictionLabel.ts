import type { Jurisdiction } from "../model/classification.schema";
import { getDestination } from "../model/destinations";

/** The destination name shown in the UI for a jurisdiction id. */
export function jurisdictionLabel(jurisdiction: Jurisdiction): string {
  return getDestination(jurisdiction).label;
}
