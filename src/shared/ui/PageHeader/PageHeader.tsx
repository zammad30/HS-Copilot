import type { HTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'
import styles from './PageHeader.module.scss'

export interface PageHeaderProps extends HTMLAttributes<HTMLElement> {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
  className,
  ...props
}: PageHeaderProps) {
  return (
    <header className={clsx(styles.header, className)} {...props}>
      <div>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className={styles.description}>{description}</p>}
      </div>
      {action && <div className={styles.action}>{action}</div>}
    </header>
  )
}
