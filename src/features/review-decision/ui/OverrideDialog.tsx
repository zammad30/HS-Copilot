import { useMemo, useState } from "react";
import type { FormEvent, RefObject } from "react";
import { Modal } from "@/shared/ui/Modal";
import { FormField } from "@/shared/ui/FormField";
import { Select } from "@/shared/ui/Select";
import { Textarea } from "@/shared/ui/Textarea";
import { Button } from "@/shared/ui/Button";
import type { Candidate, Jurisdiction } from "@/entities/classification";
import type { useReviewDecision } from "../api/useReviewDecision";
import { createOverrideFormSchema, fieldErrorsFrom } from "../model/decision.schema";
import styles from "./DecisionDialog.module.scss";

export interface OverrideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classificationId: string;
  /** The record's own destination; the new code is validated against it. */
  jurisdiction: Jurisdiction;
  currentCode: string;
  candidates: Candidate[];
  /** Shared mutation instance so every decision button/dialog reflects one pending state. */
  decision: ReturnType<typeof useReviewDecision>;
  returnFocusRef?: RefObject<HTMLElement | null>;
  onOverridden: () => void;
}

export function OverrideDialog({
  open,
  onOpenChange,
  classificationId,
  jurisdiction,
  currentCode,
  candidates,
  decision,
  returnFocusRef,
  onOverridden,
}: OverrideDialogProps) {
  const [code, setCode] = useState(currentCode);
  const [reason, setReason] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);
  const formSchema = useMemo(
    () => createOverrideFormSchema(currentCode, jurisdiction),
    [currentCode, jurisdiction],
  );

  function resetForm() {
    setCode(currentCode);
    setReason("");
    setFieldErrors({});
    setSubmitError(undefined);
  }

  function handleOpenChange(next: boolean) {
    if (!next) resetForm();
    onOpenChange(next);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(undefined);

    const result = formSchema.safeParse({ code, reason });
    const errors = fieldErrorsFrom(result);
    setFieldErrors(errors);
    if (!result.success) return;

    decision.mutate(
      {
        id: classificationId,
        action: "override",
        code: result.data.code,
        reason: result.data.reason,
      },
      {
        onSuccess: () => {
          handleOpenChange(false);
          onOverridden();
        },
        onError: () => setSubmitError("We couldn't save your decision. Try again."),
      },
    );
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Override classification code"
      returnFocusRef={returnFocusRef}
    >
      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        <FormField label="HS code" error={fieldErrors.code}>
          <Select
            value={code}
            onChange={(event) => setCode(event.target.value)}
            disabled={decision.isPending}
          >
            {candidates.map((candidate) => (
              <option key={candidate.code} value={candidate.code}>
                {candidate.code} - {candidate.title}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Reason for override" error={fieldErrors.reason}>
          <Textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Explain why the suggested code is not appropriate."
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
          <Button type="submit" variant="primary" isLoading={decision.isPending}>
            Confirm override
          </Button>
        </div>
      </form>
    </Modal>
  );
}
