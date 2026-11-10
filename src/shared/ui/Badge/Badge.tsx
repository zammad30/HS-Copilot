import type { HTMLAttributes } from 'react'
import { AlertCircle, Check, Clock3, X } from 'lucide-react'
import clsx from 'clsx'
import styles from './Badge.module.scss'

export type BadgeStatus = 'approved' | 'rejected' | 'needs-review' | 'pending' | 'overridden'

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  status: BadgeStatus
}

const ICONS = {
  approved: Check,
  rejected: X,
  'needs-review': AlertCircle,
  pending: Clock3,
  overridden: Check,
} as const

const LABELS: Record<BadgeStatus, string> = {
  approved: 'Approved',
  rejected: 'Rejected',
  'needs-review': 'Needs review',
  pending: 'Pending',
  overridden: 'Overridden',
}

const VARIANT_CLASSES: Record<BadgeStatus, string> = {
  approved: styles.approved,
  rejected: styles.rejected,
  'needs-review': styles.needsReview,
  pending: styles.pending,
  overridden: styles.overridden,
}

export function Badge({ status, className, ...props }: BadgeProps) {
  const Icon = ICONS[status]

  return (
    <span className={clsx(styles.badge, VARIANT_CLASSES[status], className)} {...props}>
      <Icon size={14} aria-hidden="true" />
      {LABELS[status]}
    </span>
  )
}
