import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { Skeleton } from './Skeleton'

describe('Skeleton', () => {
  it('is hidden from assistive tech', () => {
    const { container } = render(<Skeleton />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })

  it('renders the requested number of placeholder lines', () => {
    const { container } = render(<Skeleton lines={4} />)
    expect(container.querySelectorAll('span')).toHaveLength(4)
  })

  it('never renders a spinner icon', () => {
    const { container } = render(<Skeleton />)
    expect(container.querySelector('svg')).not.toBeInTheDocument()
  })

  it('cannot be forced visible to assistive tech via props', () => {
    const { container } = render(<Skeleton aria-hidden={false} />)
    expect(container.firstChild).toHaveAttribute('aria-hidden', 'true')
  })
})
