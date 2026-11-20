import { useState } from "react";
import { Card } from "@/shared/ui/Card";
import { FormField } from "@/shared/ui/FormField";
import { TextInput } from "@/shared/ui/TextInput";
import { Select } from "@/shared/ui/Select";
import { Checkbox } from "@/shared/ui/Checkbox";
import { Toggle } from "@/shared/ui/Toggle";
import { Button } from "@/shared/ui/Button";
import { Skeleton } from "@/shared/ui/Skeleton";
import { ErrorState } from "@/shared/ui/ErrorState";
import { Banner } from "@/shared/ui/Banner";
import { useToast } from "@/shared/ui/Toast";
import { useSession } from "@/entities/session";
import { useDocumentTitle } from "@/shared/lib/useDocumentTitle";
import { useReviewRules } from "../api/reviewRules.query";
import { useUpdateReviewRules } from "../api/reviewRules.mutation";
import {
  AUDIT_RETENTION_OPTIONS,
  SECOND_APPROVER_CHAPTER_OPTIONS,
} from "../model/reviewRules.schema";
import type { AuditRetention, ReviewRules } from "../model/reviewRules.schema";
import styles from "./SettingsRulesPage.module.scss";

function arraysEqual(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

export function SettingsRulesPage() {
  useDocumentTitle("Settings · Review rules");
  const session = useSession();
  const isAdmin = session?.role === "admin";
  const { show } = useToast();

  const { data, isPending, isError, refetch } = useReviewRules();
  const updateMutation = useUpdateReviewRules();

  const [bannerVisible, setBannerVisible] = useState(true);
  const [baseline, setBaseline] = useState<ReviewRules | null>(null);

  const [highlightAbove, setHighlightAbove] = useState("90");
  const [requireReviewBelow, setRequireReviewBelow] = useState("80");
  const [requireClarifyingQuestion, setRequireClarifyingQuestion] = useState(true);
  const [requireOverrideReason, setRequireOverrideReason] = useState(true);
  const [secondApproverEnabled, setSecondApproverEnabled] = useState(false);
  const [secondApproverChapters, setSecondApproverChapters] = useState<string[]>([]);
  const [auditRetention, setAuditRetention] = useState<AuditRetention>("24m");
  const [errors, setErrors] = useState<{ highlightAbove?: string; requireReviewBelow?: string }>(
    {},
  );

  function applyBaseline(rules: ReviewRules) {
    setBaseline(rules);
    setHighlightAbove(String(rules.highlightAbove));
    setRequireReviewBelow(String(rules.requireReviewBelow));
    setRequireClarifyingQuestion(rules.requireClarifyingQuestion);
    setRequireOverrideReason(rules.requireOverrideReason);
    setSecondApproverEnabled(rules.secondApproverChapters.length > 0);
    setSecondApproverChapters(rules.secondApproverChapters);
    setAuditRetention(rules.auditRetention);
  }

  // Re-baseline the form when fresh data arrives: the first load, or after a
  // save re-fetches. Adjusted during render, not an effect - a pure derivation.
  if (data && data !== baseline) {
    applyBaseline(data);
  }

  const effectiveChapters = secondApproverEnabled ? secondApproverChapters : [];
  const isDirty = Boolean(
    baseline &&
    (Number(highlightAbove) !== baseline.highlightAbove ||
      Number(requireReviewBelow) !== baseline.requireReviewBelow ||
      requireClarifyingQuestion !== baseline.requireClarifyingQuestion ||
      requireOverrideReason !== baseline.requireOverrideReason ||
      auditRetention !== baseline.auditRetention ||
      !arraysEqual(effectiveChapters, baseline.secondApproverChapters)),
  );

  function handleSave() {
    const highlightValue = Number(highlightAbove);
    const reviewValue = Number(requireReviewBelow);
    const nextErrors: { highlightAbove?: string; requireReviewBelow?: string } = {};
    if (!Number.isFinite(highlightValue) || highlightValue < 0 || highlightValue > 100) {
      nextErrors.highlightAbove = "Enter a value from 0 to 100.";
    }
    if (!Number.isFinite(reviewValue) || reviewValue < 0 || reviewValue > 100) {
      nextErrors.requireReviewBelow = "Enter a value from 0 to 100.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    updateMutation.mutate(
      {
        highlightAbove: highlightValue,
        requireReviewBelow: reviewValue,
        requireClarifyingQuestion,
        requireOverrideReason,
        secondApproverChapters: effectiveChapters,
        auditRetention,
      },
      {
        onSuccess: (updated) => {
          applyBaseline(updated);
          show("Review rules saved", { tone: "success" });
        },
        onError: () => show("We couldn't save review rules."),
      },
    );
  }

  function handleChapterToggle(code: string, checked: boolean) {
    setSecondApproverChapters((current) =>
      checked ? [...current, code] : current.filter((value) => value !== code),
    );
  }

  function handleDiscard() {
    if (baseline) applyBaseline(baseline);
    setErrors({});
  }

  const controlsDisabled = !isAdmin || updateMutation.isPending;

  return (
    <>
      {!isAdmin && bannerVisible && (
        <Banner onDismiss={() => setBannerVisible(false)}>
          Only admins can change review rules.
        </Banner>
      )}

      <Card className={styles.card}>
        <h2>Review rules</h2>
        <p className={styles.description}>
          Set thresholds and safeguards for classification decisions.
        </p>

        {isError ? (
          <ErrorState title="We couldn't load settings" onRetry={() => refetch()} />
        ) : isPending ? (
          <Skeleton lines={6} />
        ) : (
          <>
            <div className={styles.thresholdRow}>
              <FormField label="Highlight for approval above (%)" error={errors.highlightAbove}>
                <TextInput
                  type="number"
                  min={0}
                  max={100}
                  value={highlightAbove}
                  onChange={(event) => setHighlightAbove(event.target.value)}
                  disabled={controlsDisabled}
                />
              </FormField>
              <FormField label="Require review below (%)" error={errors.requireReviewBelow}>
                <TextInput
                  type="number"
                  min={0}
                  max={100}
                  value={requireReviewBelow}
                  onChange={(event) => setRequireReviewBelow(event.target.value)}
                  disabled={controlsDisabled}
                />
              </FormField>
            </div>

            <Toggle
              label="Require a clarifying question"
              description="Ask when key product facts are missing."
              checked={requireClarifyingQuestion}
              onChange={(event) => setRequireClarifyingQuestion(event.target.checked)}
              disabled={controlsDisabled}
            />
            <Toggle
              label="Require a written reason for overrides"
              description="Reviewers must document why they changed the suggestion."
              checked={requireOverrideReason}
              onChange={(event) => setRequireOverrideReason(event.target.checked)}
              disabled={controlsDisabled}
            />
            <Toggle
              label="Require a second approver for selected chapters"
              description="Adds a second review step for the chapters selected below."
              checked={secondApproverEnabled}
              onChange={(event) => setSecondApproverEnabled(event.target.checked)}
              disabled={controlsDisabled}
            />

            <fieldset
              className={styles.chaptersFieldset}
              disabled={!secondApproverEnabled || controlsDisabled}
            >
              <legend className={styles.chaptersLegend}>Selected chapters</legend>
              <div className={styles.chaptersList}>
                {SECOND_APPROVER_CHAPTER_OPTIONS.map((option) => (
                  <Checkbox
                    key={option.value}
                    label={option.label}
                    checked={secondApproverChapters.includes(option.value)}
                    onChange={(event) => handleChapterToggle(option.value, event.target.checked)}
                    className={styles.chapterRow}
                  />
                ))}
              </div>
              <p className={styles.hint}>Choose the chapters that need a second approver.</p>
            </fieldset>

            <FormField label="Keep audit trail for">
              <Select
                value={auditRetention}
                onChange={(event) => setAuditRetention(event.target.value as AuditRetention)}
                disabled={controlsDisabled}
              >
                {AUDIT_RETENTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </FormField>

            <div className={styles.actions}>
              <Button
                onClick={handleSave}
                disabled={!isDirty || controlsDisabled}
                isLoading={updateMutation.isPending}
              >
                Save changes
              </Button>
              <Button
                variant="secondary"
                onClick={handleDiscard}
                disabled={!isDirty || controlsDisabled}
              >
                Discard
              </Button>
            </div>
          </>
        )}
      </Card>
    </>
  );
}
