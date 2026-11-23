import { jurisdictionLabel } from "@/entities/classification";
import type { Classification } from "@/entities/classification";
import { formatFullDate } from "@/shared/lib/formatDate";
import styles from "./PrintHeader.module.scss";

export interface PrintHeaderProps {
  classification: Classification;
  /** ISO timestamp of when the page rendered; passed in so tests are stable. */
  printedAt: string;
}

/** Shown only on paper; hidden on screen with `display: none` (see the module). */
export function PrintHeader({ classification, printedAt }: PrintHeaderProps) {
  return (
    <header className={styles.header}>
      <p className={styles.title}>HS Copilot - classification record</p>
      <dl className={styles.meta}>
        <div>
          <dt>Record ID</dt>
          <dd>{classification.id}</dd>
        </div>
        <div>
          <dt>Destination</dt>
          <dd>{jurisdictionLabel(classification.jurisdiction)}</dd>
        </div>
        <div>
          <dt>Printed</dt>
          <dd>{formatFullDate(printedAt)}</dd>
        </div>
      </dl>
    </header>
  );
}
