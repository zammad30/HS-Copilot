import { forwardRef } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'
import styles from './Checkbox.module.scss'

export interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(function Checkbox(
  { label, className, ...props },
  ref,
) {
  return (
    <label className={clsx(styles.wrap, className)}>
      <input ref={ref} {...props} type="checkbox" className={styles.input} />
      {label}
    </label>
  )
})
