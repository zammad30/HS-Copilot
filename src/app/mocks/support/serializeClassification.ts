import type { Classification } from "@/entities/classification";
import type { StoredClassification } from "../fixtures/classifications.fixtures";
import { buildClassificationPath } from "./classificationPath";
import { withExpiresAt } from "./classificationExpiry";

/** The one place a stored record becomes a full `Classification` response.
 * Every endpoint that returns a full record (detail and decision) goes through
 * it, so derived fields (`expiresAt`, `path`) can never be missing from one. */
export function serializeClassification(item: StoredClassification): Classification {
  const path = buildClassificationPath(item);
  const withExpiry = withExpiresAt(item);
  return path ? { ...withExpiry, path } : withExpiry;
}
