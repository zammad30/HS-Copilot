import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Toggle } from './Toggle'

describe('Toggle', () => {
  it('renders the label and description', () => {
    render(
      <Toggle
        label="Require a clarifying question"
        description="Ask when key product facts are missing."
        checked={false}
        onChange={() => {}}
      />,
    )
    expect(screen.getByRole('switch', { name: /Require a clarifying question/ })).toBeInTheDocument()
    expect(screen.getByText('Ask when key product facts are missing.')).toBeInTheDocument()
  })

  it('is controlled: clicking calls onChange', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()
    render(<Toggle label="Require a clarifying question" checked={false} onChange={handleChange} />)

    await user.click(screen.getByRole('switch'))

    expect(handleChange).toHaveBeenCalledTimes(1)
  })

  it('reflects the checked prop', () => {
    render(<Toggle label="Require a clarifying question" checked onChange={() => {}} />)
    expect(screen.getByRole('switch')).toBeChecked()
  })

  it('blocks toggling when disabled', async () => {
    const handleChange = vi.fn()
    const user = userEvent.setup()
    render(
      <Toggle label="Require a clarifying question" checked={false} onChange={handleChange} disabled />,
    )

    await user.click(screen.getByRole('switch'))

    expect(handleChange).not.toHaveBeenCalled()
  })
})
