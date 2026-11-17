import type { HTMLAttributes } from "react";
import clsx from "clsx";
import styles from "./Skeleton.module.scss";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  lines?: number;
}

export function Skeleton({ lines = 3, className, ...props }: SkeletonProps) {
  return (
    <div className={clsx(styles.skeleton, className)} {...props} aria-hidden="true">
      {Array.from({ length: lines }, (_, index) => (
        <span key={index} className={styles.line} />
      ))}
    </div>
  );
}
