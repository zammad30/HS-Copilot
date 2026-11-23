import { useId } from "react";
import type { CSSProperties } from "react";
import { SampleLabel } from "@/shared/ui/SampleLabel";
import { CodeText } from "@/entities/classification";
import type { PathLevel } from "@/entities/classification";
import styles from "./ClassificationPath.module.scss";

export interface ClassificationPathProps {
  path?: PathLevel[];
}

const LEVEL_LABELS: Record<PathLevel["level"], string> = {
  chapter: "Chapter",
  heading: "Heading",
  subheading: "Subheading",
  national: "National line",
};

export function ClassificationPath({ path }: ClassificationPathProps) {
  const headingId = useId();

  if (!path || path.length === 0) return null;

  return (
    <section className={styles.block} aria-labelledby={headingId}>
      <h2 id={headingId}>Classification path</h2>
      <ol className={styles.levels}>
        {path.map((entry, index) => (
          <li
            key={entry.level}
            className={styles.level}
            style={{ "--depth": index } as CSSProperties}
          >
            <span className={styles.levelName}>{LEVEL_LABELS[entry.level]}</span>
            <CodeText>{entry.code}</CodeText>
            <span className={styles.title}>
              {entry.title}
              {entry.isSample && <SampleLabel />}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
