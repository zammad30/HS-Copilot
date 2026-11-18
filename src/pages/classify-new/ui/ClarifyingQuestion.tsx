import { useEffect, useRef } from "react";
import { AlertCircle } from "lucide-react";
import type { AgentRunQuestion } from "../model/agentRun.schema";
import styles from "./ClarifyingQuestion.module.scss";

export interface ClarifyingQuestionProps {
  question: AgentRunQuestion;
  isPending: boolean;
  error?: string;
  onAnswer: (optionIndex: number) => void;
}

export function ClarifyingQuestion({
  question,
  isPending,
  error,
  onAnswer,
}: ClarifyingQuestionProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className={styles.block} aria-busy={isPending || undefined}>
      <h3 ref={headingRef} tabIndex={-1} className={styles.heading}>
        <AlertCircle size={16} aria-hidden="true" />
        Clarifying question
      </h3>
      <p className={styles.text}>{question.text}</p>
      <div className={styles.options}>
        {question.options.map((option, index) => (
          <button
            key={option.label}
            type="button"
            className={styles.option}
            disabled={isPending}
            onClick={() => onAnswer(index)}
          >
            <span className={styles.optionLabel}>{option.label}</span>
            <span className={styles.optionHint}>{option.hint}</span>
          </button>
        ))}
      </div>
      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
