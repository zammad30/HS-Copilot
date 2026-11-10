import type { HTMLAttributes } from "react";
import clsx from "clsx";
import styles from "./Eyebrow.module.scss";

export type EyebrowProps = HTMLAttributes<HTMLParagraphElement>;

export function Eyebrow({ className, children, ...props }: EyebrowProps) {
  return (
    <p className={clsx(styles.eyebrow, className)} {...props}>
      {children}
    </p>
  );
}
