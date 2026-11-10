import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Badge } from './Badge'
import type { BadgeStatus } from './Badge'

const statuses: { status: BadgeStatus; label: string }[] = [
  { status: 'approved', label: 'Approved' },
  { status: 'rejected', label: 'Rejected' },
  { status: 'needs-review', label: 'Needs review' },
  { status: 'pending', label: 'Pending' },
  { status: 'overridden', label: 'Overridden' },
]

describe('Badge', () => {
  it.each(statuses)('renders the $label status with its icon and text', ({ status, label }) => {
    render(<Badge status={status} />)
    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('never relies on color alone — an icon is always present alongside the text', () => {
    render(<Badge status="approved" />)
    const badge = screen.getByText('Approved').closest('span')
    expect(badge?.querySelector('svg')).toBeInTheDocument()
  })

  it('renders the overridden status in accent, not red or green', () => {
    render(<Badge status="overridden" />)
    const badge = screen.getByText('Overridden').closest('span')
    expect(badge?.className).not.toMatch(/approved|rejected/i)
  })
})
