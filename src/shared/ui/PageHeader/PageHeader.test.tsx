import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PageHeader } from './PageHeader'
import { Button } from '../Button'

describe('PageHeader', () => {
  it('renders the title as an h1', () => {
    render(<PageHeader title="Good morning, Alex." />)
    expect(screen.getByRole('heading', { level: 1, name: 'Good morning, Alex.' })).toBeInTheDocument()
  })

  it('renders an optional eyebrow, description and action', () => {
    render(
      <PageHeader
        eyebrow="New classification"
        title="Describe the product"
        description="Include the details a reviewer would need."
        action={<Button>New classification</Button>}
      />,
    )

    expect(screen.getByText('New classification', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByText('Include the details a reviewer would need.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'New classification' })).toBeInTheDocument()
  })

  it('omits eyebrow, description and action when not given', () => {
    render(<PageHeader title="Classification library" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
