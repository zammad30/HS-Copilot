import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Banner } from './Banner'
import { Button } from '../Button'

describe('Banner', () => {
  it('announces itself to assistive tech via role="status"', () => {
    render(<Banner>Processing is throttled, resuming shortly.</Banner>)
    expect(screen.getByRole('status')).toHaveTextContent('Processing is throttled, resuming shortly.')
  })

  it('cannot have its role overridden by a caller', () => {
    render(<Banner role="alert">Message</Banner>)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('renders an optional action', () => {
    render(<Banner action={<Button variant="secondary">Resume</Button>}>Message</Banner>)
    expect(screen.getByRole('button', { name: 'Resume' })).toBeInTheDocument()
  })

  it('renders a dismiss button with an aria-label and calls onDismiss', async () => {
    const handleDismiss = vi.fn()
    const user = userEvent.setup()
    render(<Banner onDismiss={handleDismiss}>Message</Banner>)

    await user.click(screen.getByRole('button', { name: 'Dismiss' }))

    expect(handleDismiss).toHaveBeenCalledTimes(1)
  })

  it('omits the dismiss button when onDismiss is not given', () => {
    render(<Banner>Message</Banner>)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
