/**
 * Days before `expiresAt` in which a record counts as expiring soon:
 * `min(30, auditRetentionDays / 3)`. Follows the contract's Expiry section
 * (docs/api-contract.md) and mirrors the mock's expiringWindowDays in
 * app/mocks/support/classificationExpiry.ts, which the UI cannot import.
 */
export function expiringWindowDays(auditRetentionDays: number): number {
  return Math.min(30, auditRetentionDays / 3);
}
