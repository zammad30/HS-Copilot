import { forwardRef } from "react";
import type { HTMLAttributes } from "react";
import clsx from "clsx";
import styles from "./Card.module.scss";

export type CardVariant = "default" | "flat" | "selected";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(function Card(
  { variant = "default", className, children, ...props },
  ref,
) {
  return (
    <div ref={ref} className={clsx(styles.card, styles[variant], className)} {...props}>
      {children}
    </div>
  );
});
