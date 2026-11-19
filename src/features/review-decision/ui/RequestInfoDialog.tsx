import { useState } from "react";
import type { FormEvent, RefObject } from "react";
import { Modal } from "@/shared/ui/Modal";
import { FormField } from "@/shared/ui/FormField";
import { Select } from "@/shared/ui/Select";
import { Textarea } from "@/shared/ui/Textarea";
import { Button } from "@/shared/ui/Button";
import type { useReviewDecision } from "../api/useReviewDecision";
import { fieldErrorsFrom, requestInfoFormSchema } from "../model/decision.schema";
import styles from "./DecisionDialog.module.scss";

export interface AssigneeOption {
  id: string;
  name: string;
}

export interface RequestInfoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classificationId: string;
  assignees: AssigneeOption[];
  /** Shared mutation instance so every decision button/dialog reflects one pending state. */
  decision: ReturnType<typeof useReviewDecision>;
  returnFocusRef?: RefObject<HTMLElement | null>;
  onRequested: () => void;
}

export function RequestInfoDialog({
  open,
  onOpenChange,
  classificationId,
  assignees,
  decision,
  returnFocusRef,
  onRequested,
}: RequestInfoDialogProps) {
  const [assigneeId, setAssigneeId] = useState("");
  const [note, setNote] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);
  const [submitError, setSubmitError] = useState<string | undefined>(undefined);

  function resetForm() {
    setAssigneeId("");
    setNote("");
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

    const result = requestInfoFormSchema.safeParse({ assigneeId, note });
    const errors = fieldErrorsFrom(result);
    setFieldError(errors.assigneeId);
    if (!result.success) return;

    decision.mutate(
      {
        id: classificationId,
        action: "request_info",
        assigneeId: result.data.assigneeId,
        note: result.data.note || undefined,
      },
      {
        onSuccess: () => {
          handleOpenChange(false);
          onRequested();
        },
        onError: () => setSubmitError("We couldn't save your decision. Try again."),
      },
    );
  }

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Ask for more information"
      returnFocusRef={returnFocusRef}
    >
      <form onSubmit={handleSubmit} noValidate className={styles.form}>
        <FormField label="Assign to" error={fieldError}>
          <Select
            value={assigneeId}
            onChange={(event) => setAssigneeId(event.target.value)}
            disabled={decision.isPending}
          >
            <option value="">Select a person</option>
            {assignees.map((assignee) => (
              <option key={assignee.id} value={assignee.id}>
                {assignee.name}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField label="Note">
          <Textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Describe the missing product details."
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
            Send request
          </Button>
        </div>
      </form>
    </Modal>
  );
}
