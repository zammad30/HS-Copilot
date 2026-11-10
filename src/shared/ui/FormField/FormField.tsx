import { cloneElement, useId } from 'react'
import type { ReactElement } from 'react'
import styles from './FormField.module.scss'

interface ComposedControlProps {
  id?: string
  'aria-invalid'?: boolean
  'aria-describedby'?: string
}

export interface FormFieldProps {
  label?: string
  error?: string
  children: ReactElement<ComposedControlProps>
}

export function FormField({ label, error, children }: FormFieldProps) {
  const inputId = useId()
  const errorId = useId()

  const control = cloneElement(children, {
    id: inputId,
    'aria-invalid': error ? true : undefined,
    'aria-describedby': error ? errorId : undefined,
  })

  return (
    <div className={styles.field}>
      {label && (
        <label htmlFor={inputId} className={styles.label}>
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
  )
}
