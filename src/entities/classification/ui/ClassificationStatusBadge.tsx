import { StatusIndicator } from "@/shared/ui/StatusIndicator";
import type { Status } from "../model/classification.schema";

export interface ClassificationStatusBadgeProps {
  status: Status;
  overridden?: boolean;
}

const STATUS_MAP: Record<Status, "approved" | "rejected" | "needs-review" | "pending"> = {
  approved: "approved",
  rejected: "rejected",
  needs_review: "needs-review",
  pending: "pending",
};

export function ClassificationStatusBadge({ status, overridden }: ClassificationStatusBadgeProps) {
  // Business rule (docs/api-contract.md): an overridden item keeps
  // status: 'approved' but is displayed distinctly, never as plain "Approved".
  if (overridden) return <StatusIndicator status="overridden" />;
  return <StatusIndicator status={STATUS_MAP[status]} />;
}
