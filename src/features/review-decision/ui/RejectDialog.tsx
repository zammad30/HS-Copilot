import { useState } from "react";
import type { FormEvent, RefObject } from "react";
import { Modal } from "@/shared/ui/Modal";
import { FormField } from "@/shared/ui/FormField";
import { Textarea } from "@/shared/ui/Textarea";
import { Button } from "@/shared/ui/Button";
import type { useReviewDecision } from "../api/useReviewDecision";
import { fieldErrorsFrom, rejectFormSchema } from "../model/decision.schema";
import styles from "./DecisionDialog.module.scss";

export interface RejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classificationId: string;
  /** Shared mutation instance so every decision button/dialog reflects one pending state. */
  decision: ReturnType<typeof useReviewDecision>;
  returnFocusRef?: RefObject<HTMLElement | null>;
  onRejected: () => void;
}

export function RejectDialog({
  open,
  onOpenChange,
  classificationId,
  decision,
  returnFocusRef,
  onRejected,
}: RejectDialogProps) {
  const [reason, setReason] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);

  function resetForm() {
    setReason("");
    setFieldError(undefined);
    setSubmitError(undefined);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(undefined);

    const result = rejectFormSchema.safeParse({ reason });
    const errors = fieldErrorsFrom(result);
    setFieldError(errors.reason);
    if (!result.success) return;

    decision.mutate(
      { id: classificationId, action: "reject", reason: result.data.reason },
      {
        onSuccess: () => {
          handleOpenChange(false);
          onRejected();
        },
        onError: () => setSubmitError("We couldn't save your decision. Try again."),
      },
    );
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Reject classification"
      returnFocusRef={returnFocusRef}
    >
      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        <FormField label="Reason" error={fieldError}>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Add context for the rejection."
            disabled={decision.isPending}
          />
        </FormField>
        {submitError && (
          <p role="alert" className={styles.submitError}>
            {submitError}
          </p>
        )}
        <div className={styles.actions}>
          <Button
            type="button"
            variant="secondary"
            onClick={() => handleOpenChange(false)}
            disabled={decision.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" variant="reject" isLoading={decision.isPending}>
            Reject
          </Button>
        </div>
      </form>
    </Modal>
  );
}
