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
import { Badge } from '@/shared/ui/Badge'
import type { BadgeStatus } from '@/shared/ui/Badge'
import { Meter } from '@/shared/ui/Meter'
import { Card } from '@/shared/ui/Card'
import { Skeleton } from '@/shared/ui/Skeleton'
import { EmptyState } from '@/shared/ui/EmptyState'
import { Banner } from '@/shared/ui/Banner'
import { PageHeader } from '@/shared/ui/PageHeader'
import { Logo } from '@/shared/ui/Logo'
import { SampleLabel } from '@/shared/ui/SampleLabel'
import { FolderSearch2, Plus, X } from 'lucide-react'

const variants: ButtonVariant[] = ['primary', 'secondary', 'approve', 'reject', 'ghost']
const badgeStatuses: BadgeStatus[] = ['approved', 'rejected', 'needs-review', 'pending', 'overridden']

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

      <h2>Badge</h2>
      <div style={row}>
        {badgeStatuses.map((status) => (
          <Badge key={status} status={status} />
        ))}
      </div>

      <h2>Meter</h2>
      <div style={row}>
        <Meter value={92} aria-label="92% confidence" />
        <Meter value={41} aria-label="41% confidence" />
        <Meter value={0} />
      </div>

      <h2>Card</h2>
      <div style={row}>
        <Card style={{ padding: 'var(--space-2)' }}>Default (shadow)</Card>
        <Card variant="flat" style={{ padding: 'var(--space-2)' }}>
          Flat (no shadow)
        </Card>
        <Card variant="selected" style={{ padding: 'var(--space-2)' }}>
          Selected
        </Card>
      </div>

      <h2>Skeleton</h2>
      <div style={row}>
        <div style={{ width: '280px' }}>
          <Skeleton lines={3} />
        </div>
      </div>

      <h2>EmptyState</h2>
      <div style={row}>
        <EmptyState
          icon={<FolderSearch2 />}
          title="No classifications yet"
          description="Start with one product to build your reviewed library."
          action={<Button icon={<Plus />}>New classification</Button>}
        />
      </div>

      <h2>Banner</h2>
      <div style={row}>
        <Banner
          action={<Button variant="secondary">Resume</Button>}
          onDismiss={() => {}}
        >
          <strong>Processing is throttled, resuming shortly</strong>
          <span>14 of 14 products classified. Completed results are ready to review.</span>
        </Banner>
      </div>

      <h2>PageHeader</h2>
      <div style={row}>
        <PageHeader
          eyebrow="New classification"
          title="Describe the product"
          description="Include the details a reviewer would need to distinguish between headings."
          action={<Button icon={<Plus />}>New classification</Button>}
        />
      </div>

      <h2>Logo</h2>
      <div style={row}>
        <Logo onClick={() => {}} />
      </div>

      <h2>SampleLabel</h2>
      <div style={row}>
        <SampleLabel />
        <SampleLabel>Sample ruling</SampleLabel>
      </div>
    </div>
  )
}
