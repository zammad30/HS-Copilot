import { X } from "lucide-react";
import { IconButton } from "@/shared/ui/IconButton";
import { Eyebrow } from "@/shared/ui/Eyebrow";
import { SampleLabel } from "@/shared/ui/SampleLabel";
import { auditActionLabel, jurisdictionLabel } from "@/entities/classification";
import type { Classification } from "@/entities/classification";
import { formatTime } from "@/shared/lib/formatDate";
import styles from "./AuditTrailView.module.scss";

export interface AuditTrailViewProps {
  classification: Classification;
  onClose: () => void;
}

export function AuditTrailView({ classification, onClose }: AuditTrailViewProps) {
  const entries = [...classification.auditTrail].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );
  const sourceCount = classification.evidence.length;

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div>
          <Eyebrow>Record</Eyebrow>
          <h2>Audit trail</h2>
        </div>
        <IconButton
          icon={<X aria-hidden="true" />}
          aria-label="Close audit trail"
          onClick={onClose}
        />
      </div>

      <dl className={styles.meta}>
        <div>
          <dt>Jurisdiction</dt>
          <dd>{jurisdictionLabel(classification.jurisdiction)}</dd>
        </div>
        {classification.model && (
          <div>
            <dt>Model version</dt>
            <dd>
              {classification.model.version}
              {classification.model.isSample && <SampleLabel />}
            </dd>
          </div>
        )}
        <div>
          <dt>Sources</dt>
          <dd>{sourceCount === 1 ? "1 document" : `${sourceCount} documents`}</dd>
        </div>
      </dl>

      <ol className={styles.entries}>
        {entries.map((entry) => (
          <li key={entry.id}>
            <span className={styles.entryTime}>{formatTime(entry.at)}</span>
            <strong>{auditActionLabel(entry.action)}</strong>
            <p>{entry.detail}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
