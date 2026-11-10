import { forwardRef } from 'react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import clsx from 'clsx'
import styles from './IconButton.module.scss'

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode
  'aria-label': string
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { icon, type = 'button', className, ...props },
  ref,
) {
  return (
    <button ref={ref} type={type} className={clsx(styles.iconButton, className)} {...props}>
      {icon}
    </button>
  )
})
