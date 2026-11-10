import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FolderSearch2 } from 'lucide-react'
import { EmptyState } from './EmptyState'
import { Button } from '../Button'

describe('EmptyState', () => {
  it('renders the icon hidden from assistive tech, plus the title', () => {
    const { container } = render(<EmptyState icon={<FolderSearch2 />} title="No classifications yet" />)
    expect(screen.getByText('No classifications yet')).toBeInTheDocument()
    expect(container.querySelector('[aria-hidden="true"] svg')).toBeInTheDocument()
  })

  it('renders an optional description and action', async () => {
    const handleClick = vi.fn()
    const user = userEvent.setup()
    render(
      <EmptyState
        icon={<FolderSearch2 />}
        title="No classifications yet"
        description="Start with one product to build your reviewed library."
        action={<Button onClick={handleClick}>New classification</Button>}
      />,
    )

    expect(screen.getByText('Start with one product to build your reviewed library.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'New classification' }))
    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('omits the description when not given', () => {
    render(<EmptyState icon={<FolderSearch2 />} title="No classifications yet" />)
    expect(screen.queryByText(/start with one product/i)).not.toBeInTheDocument()
  })
})
