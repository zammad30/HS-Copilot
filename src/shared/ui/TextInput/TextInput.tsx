import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";
import clsx from "clsx";
import styles from "./TextInput.module.scss";

export type TextInputProps = InputHTMLAttributes<HTMLInputElement>;

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(function TextInput(
  { className, ...props },
  ref,
) {
  return <input ref={ref} className={clsx(styles.input, className)} {...props} />;
});
