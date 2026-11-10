import { useState } from 'react'
import type { CSSProperties } from 'react'
import { Button } from '@/shared/ui/Button'
import type { ButtonVariant } from '@/shared/ui/Button'
import { IconButton } from '@/shared/ui/IconButton'
import { TextInput } from '@/shared/ui/TextInput'
import { Textarea } from '@/shared/ui/Textarea'
import { Select } from '@/shared/ui/Select'
import { SearchField } from '@/shared/ui/SearchField'
import { FormField } from '@/shared/ui/FormField'
import { Checkbox } from '@/shared/ui/Checkbox'
import { Toggle } from '@/shared/ui/Toggle'
import { X } from 'lucide-react'

const variants: ButtonVariant[] = ['primary', 'secondary', 'approve', 'reject', 'ghost']

const row: CSSProperties = {
  display: 'flex',
  gap: 'var(--space-2)',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
}

export function KitPage() {
  const [text, setText] = useState('Men’s 100% cotton knitted crew-neck T-shirt')
  const [description, setDescription] = useState('')
  const [jurisdiction, setJurisdiction] = useState('us')
  const [search, setSearch] = useState('')
  const [checked, setChecked] = useState(false)
  const [toggled, setToggled] = useState(false)

  return (
    <div>
      <h1>Component kit</h1>

      <h2>Button</h2>
      <div style={row}>
        {variants.map((variant) => (
          <Button key={variant} variant={variant}>
            {variant}
          </Button>
        ))}
        <Button isLoading>Loading</Button>
        <Button disabled>Disabled</Button>
      </div>

      <h2>IconButton</h2>
      <div style={row}>
        <IconButton icon={<X />} aria-label="Close" />
        <IconButton icon={<X />} aria-label="Close (disabled)" disabled />
      </div>

      <h2>TextInput</h2>
      <div style={row}>
        <TextInput value={text} onChange={(event) => setText(event.target.value)} placeholder="Default" />
        <TextInput value="" onChange={() => {}} placeholder="Error" aria-invalid="true" />
        <TextInput value="Disabled" onChange={() => {}} disabled />
      </div>

      <h2>Textarea</h2>
      <div style={row}>
        <Textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Default"
        />
        <Textarea value="" onChange={() => {}} placeholder="Error" aria-invalid="true" />
        <Textarea value="Disabled" onChange={() => {}} disabled />
      </div>

      <h2>Select</h2>
      <div style={row}>
        <Select value={jurisdiction} onChange={(event) => setJurisdiction(event.target.value)}>
          <option value="us">United States — HTS</option>
          <option value="eu">European Union — CN</option>
        </Select>
        <Select value="" onChange={() => {}} aria-invalid="true">
          <option value="">Error</option>
        </Select>
        <Select value="" onChange={() => {}} disabled>
          <option value="">Disabled</option>
        </Select>
      </div>

      <h2>SearchField</h2>
      <div style={row}>
        <SearchField
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label="Search products or HS codes"
          placeholder="Search products or HS codes"
        />
        <SearchField
          value=""
          onChange={() => {}}
          aria-label="Search (error)"
          placeholder="Error"
          aria-invalid="true"
        />
        <SearchField value="Disabled" onChange={() => {}} aria-label="Search (disabled)" disabled />
      </div>

      <h2>FormField</h2>
      <div style={row}>
        <FormField label="Product description">
          <TextInput value={text} onChange={(event) => setText(event.target.value)} />
        </FormField>
        <FormField label="Product description" error="Enter a product description.">
          <TextInput value="" onChange={() => {}} />
        </FormField>
        <FormField label="Country of origin">
          <Select value={jurisdiction} onChange={(event) => setJurisdiction(event.target.value)}>
            <option value="us">United States</option>
            <option value="eu">European Union</option>
          </Select>
        </FormField>
      </div>

      <h2>Checkbox</h2>
      <div style={row}>
        <Checkbox label="Unchecked" checked={checked} onChange={(event) => setChecked(event.target.checked)} />
        <Checkbox label="Checked" checked onChange={() => {}} />
        <Checkbox label="Disabled" checked={false} onChange={() => {}} disabled />
      </div>

      <h2>Toggle</h2>
      <div style={row}>
        <Toggle
          label="Off"
          description="Toggle is off"
          checked={toggled}
          onChange={(event) => setToggled(event.target.checked)}
        />
        <Toggle label="On" description="Toggle is on" checked onChange={() => {}} />
        <Toggle label="Disabled" checked={false} onChange={() => {}} disabled />
      </div>
    </div>
  )
}
