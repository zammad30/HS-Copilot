import type { HTMLAttributes, ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import clsx from "clsx";
import { Button } from "../Button";
import styles from "./ErrorState.module.scss";

export interface ErrorStateProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  description?: string;
  onRetry?: () => void;
  retryLabel?: string;
  action?: ReactNode;
}

export function ErrorState({
  title,
  description,
  onRetry,
  retryLabel = "Try again",
  action,
  className,
  ...props
}: ErrorStateProps) {
  return (
    <div className={clsx(styles.errorState, className)} role="alert" {...props}>
      <span className={styles.icon} aria-hidden="true">
        <TriangleAlert />
      </span>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
      {action}
    </div>
  );
}
