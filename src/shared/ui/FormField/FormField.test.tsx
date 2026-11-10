import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FormField } from './FormField'
import { TextInput } from '../TextInput'
import { Textarea } from '../Textarea'
import { Select } from '../Select'

describe('FormField', () => {
  it('links the label to the control via a generated id/htmlFor', () => {
    render(
      <FormField label="Product description">
        <TextInput value="" onChange={() => {}} />
      </FormField>,
    )

    expect(screen.getByLabelText('Product description')).toBeInTheDocument()
  })

  it('sets aria-invalid and aria-describedby on the control when there is an error', () => {
    render(
      <FormField label="Product description" error="This field is required.">
        <TextInput value="" onChange={() => {}} />
      </FormField>,
    )

    const input = screen.getByLabelText('Product description')
    const error = screen.getByRole('alert')

    expect(input).toHaveAttribute('aria-invalid', 'true')
    expect(input).toHaveAttribute('aria-describedby', error.id)
    expect(error).toHaveTextContent('This field is required.')
  })

  it('omits the label and error elements when not given', () => {
    render(
      <FormField>
        <TextInput value="" onChange={() => {}} aria-label="Product description" />
      </FormField>,
    )

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('composes Textarea', () => {
    render(
      <FormField label="Description">
        <Textarea value="" onChange={() => {}} />
      </FormField>,
    )
    expect(screen.getByLabelText('Description').tagName).toBe('TEXTAREA')
  })

  it('composes Select', () => {
    render(
      <FormField label="Jurisdiction">
        <Select value="us" onChange={() => {}}>
          <option value="us">United States</option>
        </Select>
      </FormField>,
    )
    expect(screen.getByLabelText('Jurisdiction').tagName).toBe('SELECT')
  })

  it("keeps the child's own id and points the label at it, instead of overwriting it", () => {
    render(
      <FormField label="Product description">
        <TextInput id="product-description" value="" onChange={() => {}} />
      </FormField>,
    )

    const input = screen.getByLabelText('Product description')
    expect(input).toHaveAttribute('id', 'product-description')
  })

  it("merges the child's existing aria-describedby with the error id, with no duplicates", () => {
    render(
      <FormField label="Product description" error="This field is required.">
        <TextInput value="" onChange={() => {}} aria-describedby="hint-1" />
      </FormField>,
    )

    const input = screen.getByLabelText('Product description')
    const error = screen.getByRole('alert')
    const describedBy = input.getAttribute('aria-describedby')?.split(' ')

    expect(describedBy).toEqual(['hint-1', error.id])
  })

  it('focuses the control when the label text is clicked', async () => {
    const user = userEvent.setup()
    render(
      <FormField label="Product description">
        <TextInput value="" onChange={() => {}} />
      </FormField>,
    )

    await user.click(screen.getByText('Product description'))

    expect(screen.getByLabelText('Product description')).toHaveFocus()
  })
})
