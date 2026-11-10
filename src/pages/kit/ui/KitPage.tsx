import { Button } from '@/shared/ui/Button'
import type { ButtonVariant } from '@/shared/ui/Button'

const variants: ButtonVariant[] = ['primary', 'secondary', 'approve', 'reject', 'ghost']

export function KitPage() {
  return (
    <div>
      <h1>Component kit</h1>
      <h2>Button</h2>
      <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
        {variants.map((variant) => (
          <Button key={variant} variant={variant}>
            {variant}
          </Button>
        ))}
        <Button isLoading>Loading</Button>
        <Button disabled>Disabled</Button>
      </div>
    </div>
  )
}
