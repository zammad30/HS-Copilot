import type { AuditEntry, Classification } from "@/entities/classification";

/**
 * Applies the `approve` decision transition in place, per
 * docs/api-contract.md's Decision rules table. Shared by the single-item
 * decision handler and the batch bulk-approve handler, so both append the
 * exact same audit entry shape for an approval.
 */
export function applyApproveTransition(
  item: Classification,
  code: string | undefined,
  actorName: string,
): AuditEntry {
  const resolvedCode = code?.trim() || item.suggestedCode;
  const now = new Date().toISOString();
  item.status = "approved";
  item.finalCode = resolvedCode;
  item.overridden = false;
  item.updatedAt = now;
  const entry: AuditEntry = {
    id: `${item.id}_audit_${item.auditTrail.length + 1}`,
    at: now,
    actor: actorName,
    action: "approved",
    detail: `${actorName} approved ${resolvedCode}.`,
  };
  item.auditTrail.push(entry);
  return entry;
}
