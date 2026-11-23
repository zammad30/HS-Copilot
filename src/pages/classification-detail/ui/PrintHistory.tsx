import { auditActionLabel, useClassification } from "@/entities/classification";
import { formatTime } from "@/shared/lib/formatDate";
import styles from "./PrintHistory.module.scss";

export interface PrintHistoryProps {
  classificationId: string;
}

/** Decision history for paper only. It reads the same query (and cache key) as
 * the audit drawer and renders nothing while that query is loading or has
 * failed, so it can never block the page or show an error of its own. */
export function PrintHistory({ classificationId }: PrintHistoryProps) {
  const { data } = useClassification(classificationId);

  if (!data || data.auditTrail.length === 0) return null;

  const entries = [...data.auditTrail].sort(
    (a, b) => new Date(b.at).getTime() - new Date(a.at).getTime(),
  );

  return (
    <section className={styles.history} aria-label="Decision history">
      <h2>Decision history</h2>
      <ol className={styles.entries}>
        {entries.map((entry) => (
          <li key={entry.id}>
            <span className={styles.time}>{formatTime(entry.at)}</span>
            <strong>{auditActionLabel(entry.action)}</strong>
            <p>{entry.detail}</p>
          </li>
        ))}
      </ol>
    </section>
  );
}
