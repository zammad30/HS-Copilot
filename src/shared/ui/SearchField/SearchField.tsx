import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { Search } from 'lucide-react'
import clsx from 'clsx'
import styles from './SearchField.module.scss'

export interface SearchFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  'aria-label': string
}

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  { className, ...props },
  ref,
) {
  return (
    <span className={clsx(styles.wrap, className)}>
      <Search className={styles.icon} size={16} aria-hidden="true" />
      <input ref={ref} {...props} type="search" className={styles.input} />
    </span>
  )
})
