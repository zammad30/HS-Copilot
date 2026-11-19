import type { RefObject } from "react";
import { Check, CircleHelp, PencilLine, XCircle } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import type { Classification } from "@/entities/classification";
import { effectiveCode } from "@/entities/classification";
import styles from "./ReviewActions.module.scss";

export interface ReviewActionsProps {
  classification: Classification;
  approvedByName?: string;
  isPending: boolean;
  decisionError?: string;
  onApprove: () => void;
  onOpenReject: () => void;
  onOpenOverride: () => void;
  onOpenRequestInfo: () => void;
  rejectTriggerRef: RefObject<HTMLButtonElement | null>;
  overrideTriggerRef: RefObject<HTMLButtonElement | null>;
  requestInfoTriggerRef: RefObject<HTMLButtonElement | null>;
}

export function ReviewActions({
  classification,
  approvedByName,
  isPending,
  decisionError,
  onApprove,
  onOpenReject,
  onOpenOverride,
  onOpenRequestInfo,
  rejectTriggerRef,
  overrideTriggerRef,
  requestInfoTriggerRef,
}: ReviewActionsProps) {
  const code = effectiveCode(classification);

  return (
    <div className={styles.row} role="group" aria-label="Review actions">
      {classification.status === "approved" ? (
        // CD-2 deviation: design.md's "Approved by ..." chip-style Button exception
        // doesn't fit here (no new Button variant), and StatusIndicator can't take
        // custom text without an API change, so this reuses its token classes
        // page-locally per the brief's documented default.
        <span className={styles.approvedChip}>
          <span aria-hidden="true" className={styles.approvedDot} />
          {approvedByName ? `Approved by ${approvedByName}` : "Approved"}
        </span>
      ) : (
        <Button
          variant="approve"
          icon={<Check aria-hidden="true" />}
          isLoading={isPending}
          disabled={isPending}
          onClick={onApprove}
        >
          {`Approve ${code}`}
        </Button>
      )}

      <Button
        ref={overrideTriggerRef}
        variant="secondary"
        icon={<PencilLine aria-hidden="true" />}
        disabled={isPending}
        onClick={onOpenOverride}
      >
        Override code
      </Button>

      <Button
        ref={rejectTriggerRef}
        variant="reject"
        icon={<XCircle aria-hidden="true" />}
        disabled={isPending}
        onClick={onOpenReject}
      >
        Reject
      </Button>

      <Button
        ref={requestInfoTriggerRef}
        variant="secondary"
        icon={<CircleHelp aria-hidden="true" />}
        disabled={isPending}
        onClick={onOpenRequestInfo}
      >
        Ask for more info
      </Button>

      {decisionError && (
        <p role="alert" className={styles.decisionError}>
          {decisionError}
        </p>
      )}
    </div>
  );
}
