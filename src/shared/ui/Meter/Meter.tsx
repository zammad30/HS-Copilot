import type { HTMLAttributes } from "react";
import clsx from "clsx";
import styles from "./Meter.module.scss";

export interface MeterProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
}

export function Meter({ value, className, "aria-label": ariaLabel, ...props }: MeterProps) {
  const clamped = Math.min(100, Math.max(0, value));

  return (
    <div
      className={clsx(styles.meter, className)}
      aria-label={ariaLabel ?? `${clamped}%`}
      {...props}
    >
      <span className={styles.value}>{clamped}%</span>
      <span className={styles.track}>
        <span className={styles.fill} style={{ width: `${clamped}%` }} />
      </span>
    </div>
  );
}
