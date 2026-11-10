import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'
import styles from './EmptyState.module.scss'

export interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function EmptyState({ icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div className={clsx(styles.emptyState, className)} {...props}>
      <span className={styles.icon} aria-hidden="true">
        {icon}
      </span>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action}
    </div>
  )
}
