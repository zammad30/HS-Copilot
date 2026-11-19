import { ArrowRight } from "lucide-react";
import clsx from "clsx";
import { Card } from "@/shared/ui/Card";
import { Meter } from "@/shared/ui/Meter";
import { CodeText } from "@/entities/classification";
import type { Candidate } from "@/entities/classification";
import styles from "./CandidateCard.module.scss";

export interface CandidateCardProps {
  candidate: Candidate;
  rank: number;
  isSelected: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

export function CandidateCard({
  candidate,
  rank,
  isSelected,
  isOpen,
  onToggle,
}: CandidateCardProps) {
  const panelId = `candidate-reasoning-${candidate.code}`;

  return (
    <Card variant={isSelected ? "selected" : "default"} className={styles.card}>
      <div className={styles.row}>
        <span className={styles.rank}>{String(rank).padStart(2, "0")}</span>
        <div className={styles.main}>
          <CodeText>{candidate.code}</CodeText>
          <span className={styles.title}>{candidate.title}</span>
        </div>
        <Meter value={candidate.confidence} aria-label={`${candidate.confidence}% confidence`} />
        <button
          type="button"
          className={styles.disclosure}
          aria-expanded={isOpen}
          aria-controls={panelId}
          onClick={onToggle}
        >
          {isOpen ? "Hide reasoning" : "View reasoning"}
          <ArrowRight
            aria-hidden="true"
            size={16}
            className={clsx(styles.arrow, isOpen && styles.arrowOpen)}
          />
        </button>
      </div>

      {isOpen && (
        <ol id={panelId} className={styles.reasoningList}>
          {candidate.reasoning.map((step, index) => (
            <li key={step.title}>
              <span className={styles.stepNumber}>{index + 1}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
