import type { Jurisdiction } from "./classification.schema";

export interface Destination {
  id: Jurisdiction;
  label: string;
  /** Accepted digit counts for an import code; the first entry is the canonical import length. */
  allowedLengths: readonly number[];
}

/** Single source for destination names and code lengths. Order is the UI order. */
export const DESTINATIONS: readonly Destination[] = [
  { id: "US_HTS", label: "United States", allowedLengths: [10] },
  { id: "EU_CN", label: "European Union", allowedLengths: [10, 8] },
  { id: "UK_UKGT", label: "United Kingdom", allowedLengths: [10] },
  { id: "CA_CCT", label: "Canada", allowedLengths: [10] },
  { id: "AU_WT", label: "Australia", allowedLengths: [10] },
  { id: "TR_GTIP", label: "Turkey", allowedLengths: [12] },
];

export function getDestination(id: Jurisdiction): Destination {
  const destination = DESTINATIONS.find((entry) => entry.id === id);
  if (!destination) throw new Error(`Unknown destination: ${id}`);
  return destination;
}

export function importCodeLength(id: Jurisdiction): number {
  return getDestination(id).allowedLengths[0];
}
