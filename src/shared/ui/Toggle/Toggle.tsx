import { forwardRef } from "react";
import type { ChangeEventHandler } from "react";
import styles from "./Toggle.module.scss";

export interface ToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: ChangeEventHandler<HTMLInputElement>;
  disabled?: boolean;
}

export const Toggle = forwardRef<HTMLInputElement, ToggleProps>(function Toggle(
  { label, description, checked, onChange, disabled },
  ref,
) {
  return (
    <label className={styles.row}>
      <span className={styles.text}>
        <strong>{label}</strong>
        {description && <small>{description}</small>}
      </span>
      <input
        ref={ref}
        type="checkbox"
        role="switch"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className={styles.input}
      />
      <i aria-hidden="true" className={styles.track} />
    </label>
  );
});
