import type { HTMLAttributes } from "react";
import clsx from "clsx";
import styles from "./StatusIndicator.module.scss";

export type StatusIndicatorStatus =
  "approved" | "rejected" | "needs-review" | "pending" | "overridden";

export interface StatusIndicatorProps extends HTMLAttributes<HTMLSpanElement> {
  status: StatusIndicatorStatus;
}

const LABELS: Record<StatusIndicatorStatus, string> = {
  approved: "Approved",
  rejected: "Rejected",
  "needs-review": "Needs review",
  pending: "Pending",
  overridden: "Overridden",
};

const VARIANT_CLASSES: Record<StatusIndicatorStatus, string> = {
  approved: styles.approved,
  rejected: styles.rejected,
  "needs-review": styles.needsReview,
  pending: styles.pending,
  overridden: styles.overridden,
};

export function StatusIndicator({ status, className, ...props }: StatusIndicatorProps) {
  return (
    <span className={clsx(styles.statusIndicator, className)} {...props}>
      <span aria-hidden="true" className={clsx(styles.dot, VARIANT_CLASSES[status])} />
      {LABELS[status]}
    </span>
  );
}
