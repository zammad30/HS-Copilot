import { X } from "lucide-react";
import { IconButton } from "@/shared/ui/IconButton";
import { Eyebrow } from "@/shared/ui/Eyebrow";
import { SampleLabel } from "@/shared/ui/SampleLabel";
import type { Evidence } from "@/entities/classification";
import styles from "./EvidenceDetailView.module.scss";

export interface EvidenceDetailViewProps {
  evidence: Evidence;
  onClose: () => void;
}

export function EvidenceDetailView({ evidence, onClose }: EvidenceDetailViewProps) {
  const heading = evidence.kind === "tariff_text" ? "Tariff source" : "Past ruling";

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div>
          <Eyebrow>Evidence</Eyebrow>
          <h2>{heading}</h2>
        </div>
        <IconButton icon={<X aria-hidden="true" />} aria-label="Close evidence" onClick={onClose} />
      </div>

      <p className={styles.caption}>
        {evidence.reference}
        {evidence.isSample && <SampleLabel />}
      </p>
      <h3>{evidence.title}</h3>
      <p className={styles.body}>{evidence.excerpt}</p>
      {evidence.sourceUrl && (
        <a className={styles.link} href={evidence.sourceUrl} target="_blank" rel="noreferrer">
          Open original source
        </a>
      )}
    </div>
  );
}
