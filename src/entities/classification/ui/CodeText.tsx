import type { HTMLAttributes, ReactNode } from "react";
import clsx from "clsx";
import styles from "./CodeText.module.scss";

export interface CodeTextProps extends HTMLAttributes<HTMLSpanElement> {
  size?: "default" | "hero";
  children: ReactNode;
}

export function CodeText({ size = "default", className, children, ...props }: CodeTextProps) {
  return (
    <span className={clsx(styles.codeText, size === "hero" && styles.hero, className)} {...props}>
      {children}
    </span>
  );
}
