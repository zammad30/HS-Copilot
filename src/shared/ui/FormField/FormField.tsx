import { cloneElement, useId } from "react";
import type { ReactElement } from "react";
import styles from "./FormField.module.scss";

interface ComposedControlProps {
  id?: string;
  "aria-invalid"?: boolean | "true" | "false";
  "aria-describedby"?: string;
}

export interface FormFieldProps {
  label?: string;
  error?: string;
  children: ReactElement<ComposedControlProps>;
}

function isInvalid(value: ComposedControlProps["aria-invalid"]): boolean {
  return value === true || value === "true";
}

function mergeDescribedBy(
  existing: string | undefined,
  errorId: string | undefined,
): string | undefined {
  const ids = [...(existing?.split(/\s+/).filter(Boolean) ?? []), ...(errorId ? [errorId] : [])];
  const unique = Array.from(new Set(ids));
  return unique.length > 0 ? unique.join(" ") : undefined;
}

export function FormField({ label, error, children }: FormFieldProps) {
  const generatedId = useId();
  const errorId = useId();

  const controlId = children.props.id ?? generatedId;
  const invalid = isInvalid(children.props["aria-invalid"]) || Boolean(error);
  const describedBy = mergeDescribedBy(
    children.props["aria-describedby"],
    error ? errorId : undefined,
  );

  const control = cloneElement(children, {
    id: controlId,
    "aria-invalid": invalid || undefined,
    "aria-describedby": describedBy,
  });

  return (
    <div className={styles.field}>
      {label && (
        <label htmlFor={controlId} className={styles.label}>
          {label}
        </label>
      )}
      {control}
      {error && (
        <span id={errorId} className={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
