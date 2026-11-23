import { BookOpen, Copy, History } from "lucide-react";
import { Button } from "@/shared/ui/Button";
import { Card } from "@/shared/ui/Card";
import { Meter } from "@/shared/ui/Meter";
import { StatusIndicator } from "@/shared/ui/StatusIndicator";
import { useCopyToClipboard } from "@/shared/lib/useCopyToClipboard";
import { ClassificationStatusBadge, CodeText, effectiveCode } from "@/entities/classification";
import type { Classification, Evidence } from "@/entities/classification";
import styles from "./RecommendationCard.module.scss";

export interface RecommendationCardProps {
  classification: Classification;
  onOpenEvidence: (evidence: Evidence, trigger: HTMLButtonElement) => void;
}

function chipLabel(reference: string, title: string): string {
  return reference.length <= title.length ? reference : title;
}

export function RecommendationCard({ classification, onOpenEvidence }: RecommendationCardProps) {
  const code = effectiveCode(classification);
  const copyToClipboard = useCopyToClipboard();

  return (
    <Card className={styles.card}>
      <div className={styles.topRow}>
        <div>
          <span className={styles.label}>Recommended code</span>
          <div className={styles.codeLine}>
            <CodeText size="hero">{code}</CodeText>
            <Button
              variant="ghost"
              icon={<Copy aria-hidden="true" size={16} />}
              className={styles.copyButton}
              onClick={() => copyToClipboard(code, "HS code copied")}
            >
              Copy code
            </Button>
          </div>
          <div className={styles.statuses}>
            <ClassificationStatusBadge status={classification.status} />
            {classification.overridden && <StatusIndicator status="overridden" />}
          </div>
        </div>
        <div className={styles.confidenceBlock}>
          <span className={styles.label}>Overall confidence</span>
          <Meter
            value={classification.confidence}
            aria-label={`${classification.confidence}% overall confidence`}
          />
        </div>
      </div>

      <h2 className={styles.description}>{classification.description}</h2>

      <div className={styles.chips}>
        {classification.evidence.map((item) => (
          <button
            key={item.reference}
            type="button"
            className={styles.chip}
            onClick={(event) => onOpenEvidence(item, event.currentTarget)}
          >
            {item.kind === "tariff_text" ? (
              <BookOpen aria-hidden="true" size={16} />
            ) : (
              <History aria-hidden="true" size={16} />
            )}
            {chipLabel(item.reference, item.title)}
          </button>
        ))}
      </div>
    </Card>
  );
}
