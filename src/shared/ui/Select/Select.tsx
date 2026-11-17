import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";
import styles from "./Select.module.scss";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { className, children, ...props },
  ref,
) {
  return (
    <span className={clsx(styles.wrap, className)}>
      <select ref={ref} className={styles.select} {...props}>
        {children}
      </select>
      <ChevronDown className={styles.chevron} size={16} aria-hidden="true" />
    </span>
  );
});
