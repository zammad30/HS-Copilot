import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Card } from './Card'
import styles from './Card.module.scss'

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Table card</Card>)
    expect(screen.getByText('Table card')).toBeInTheDocument()
  })

  it('applies the flat variant class (no shadow)', () => {
    const { container } = render(<Card variant="flat">Evidence card</Card>)
    expect(container.firstChild).toHaveClass(styles.flat)
  })

  it('applies the selected variant class (accent border)', () => {
    const { container } = render(<Card variant="selected">Chosen candidate</Card>)
    expect(container.firstChild).toHaveClass(styles.selected)
  })

  it('forwards native props such as onClick', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    render(<Card onClick={handleClick}>Clickable card</Card>)

    await user.click(screen.getByText('Clickable card'))

    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
