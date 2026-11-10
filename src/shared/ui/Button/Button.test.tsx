import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Button } from './Button'
import styles from './Button.module.scss'

describe('Button', () => {
  it('renders children and responds to click', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    render(<Button onClick={handleClick}>Approve</Button>)

    const button = screen.getByRole('button', { name: 'Approve' })
    await user.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies a variant class for each supported variant', () => {
    const { rerender } = render(<Button variant="primary">Save</Button>)
    expect(screen.getByRole('button')).toHaveClass(styles.primary)

    for (const variant of ['secondary', 'approve', 'reject', 'ghost'] as const) {
      rerender(<Button variant={variant}>Save</Button>)
      expect(screen.getByRole('button')).toHaveClass(styles[variant])
    }
  })

  it('disables the button and marks it busy while loading', () => {
    render(<Button isLoading>Save</Button>)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
  })

  it('loads the SCSS module with real, non-empty hashed class names', () => {
    // Proves the "@use '@/shared/styles/abstracts' as *;" alias resolves and
    // the module pipeline (not an empty-object stub) is active end to end.
    expect(styles.button).toBeTruthy()
    expect(styles.button).not.toBe('button')
  })
})
