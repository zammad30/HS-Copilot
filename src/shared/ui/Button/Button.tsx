import { forwardRef } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Loader2 } from "lucide-react";
import clsx from "clsx";
import styles from "./Button.module.scss";

export type ButtonVariant = "primary" | "secondary" | "approve" | "reject" | "ghost";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  icon?: ReactNode;
  type?: "button" | "submit";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    isLoading = false,
    icon,
    disabled,
    className,
    children,
    type = "button",
    ...props
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      aria-busy={isLoading || undefined}
      disabled={disabled || isLoading}
      className={clsx(styles.button, styles[variant], isLoading && styles.loading, className)}
      {...props}
    >
      {isLoading && <Loader2 className={styles.spinner} size={16} aria-hidden="true" />}
      {icon}
      <span className={styles.label}>{children}</span>
    </button>
  );
});
