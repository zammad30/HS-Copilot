import type { HTMLAttributes, ReactNode } from "react";
import { AlertCircle, X } from "lucide-react";
import clsx from "clsx";
import { IconButton } from "../IconButton";
import styles from "./Banner.module.scss";

export interface BannerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  action?: ReactNode;
  onDismiss?: () => void;
  dismissLabel?: string;
}

export function Banner({
  children,
  action,
  onDismiss,
  dismissLabel = "Dismiss",
  className,
  ...props
}: BannerProps) {
  return (
    <div className={clsx(styles.banner, className)} {...props} role="status">
      <AlertCircle className={styles.icon} size={20} aria-hidden="true" />
      <div className={styles.content}>{children}</div>
      {action}
      {onDismiss && <IconButton icon={<X />} aria-label={dismissLabel} onClick={onDismiss} />}
    </div>
  );
}
