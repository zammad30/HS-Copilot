import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import styles from "./SampleLabel.module.scss";

export interface SampleLabelProps extends HTMLAttributes<HTMLSpanElement> {
  children?: ReactNode;
}

export function SampleLabel({ children = "Sample data", className, ...props }: SampleLabelProps) {
  return (
    <span className={clsx(styles.sampleLabel, className)} {...props}>
      {children}
    </span>
  );
}
