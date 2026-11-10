---
description: Add or extend a component in shared/ui
argument-hint: <ComponentName>
---

Add or extend `shared/ui/$ARGUMENTS`.

1. Check docs/component-inventory.md and search the code. If it exists, extend it instead of creating a duplicate.
2. Read the component spec in design.md and the relevant Figma reference. Do not invent variants.
3. Propose the props API and wait for my OK.
4. Implement `$ARGUMENTS.tsx`, `$ARGUMENTS.module.scss` (tokens only), `$ARGUMENTS.test.tsx`, `index.ts`. Accessible by default.
5. Add it to the `/_kit` page with all variants and states, update the inventory, run `npm run check`.
