import { Card } from "@/shared/ui/Card";
import { Eyebrow } from "@/shared/ui/Eyebrow";
import { SampleLabel } from "@/shared/ui/SampleLabel";
import type { Evidence } from "@/entities/classification";
import styles from "./EvidenceGrid.module.scss";

export interface EvidenceGridProps {
  evidence: Evidence[];
  onOpenSource: (evidence: Evidence, trigger: HTMLButtonElement) => void;
  onOpenRuling: (evidence: Evidence, trigger: HTMLButtonElement) => void;
}

export function EvidenceGrid({ evidence, onOpenSource, onOpenRuling }: EvidenceGridProps) {
  const tariffText = evidence.find((item) => item.kind === "tariff_text");
  const ruling = evidence.find((item) => item.kind === "ruling");

  if (!tariffText && !ruling) return null;

  return (
    <div className={styles.grid}>
      {tariffText && (
        <Card className={styles.card}>
          <Eyebrow className={styles.eyebrow}>Tariff text</Eyebrow>
          <h3>{tariffText.title}</h3>
          <blockquote>{tariffText.excerpt}</blockquote>
          <button
            type="button"
            className={styles.link}
            onClick={(event) => onOpenSource(tariffText, event.currentTarget)}
          >
            Open source
          </button>
        </Card>
      )}
      {ruling && (
        <Card className={styles.card}>
          <Eyebrow className={styles.eyebrow}>Similar past ruling</Eyebrow>
          <h3>
            {ruling.reference}
            {ruling.isSample && <SampleLabel />}
          </h3>
          <p>{ruling.excerpt}</p>
          <button
            type="button"
            className={styles.link}
            onClick={(event) => onOpenRuling(ruling, event.currentTarget)}
          >
            View ruling
          </button>
        </Card>
      )}
    </div>
  );
}
