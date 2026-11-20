# HS Copilot Web: Claude Code instructions

Read this file before every task. It is the source of truth for architecture, styling and conventions. If a request conflicts with it, say so and ask before proceeding. Never introduce a different architecture, styling approach, dependency or design on your own.

@design.md
@docs/architecture.md
@docs/workflow.md
@docs/component-inventory.md
@docs/api-contract.md

## 1. Product context

HS Copilot helps importers and customs brokers classify products into HS tariff codes. AI suggests ranked codes with cited evidence; a human reviewer approves, rejects or overrides each one. This repository is the frontend only. The NestJS API and the FastAPI + LangGraph AI service come later. Until then every page runs on realistic mock data served by MSW.

## 2. Fixed stack

- React + TypeScript (strict) + Vite
- React Router (data router, lazy-loaded routes) via the `react-router` package (not `react-router-dom` - v7+ merged DOM bindings into the main package; import `createBrowserRouter`/`RouterProvider`/etc. from `react-router`)
- TanStack Query for all server state
- SCSS Modules (`sass`) for all styling; design tokens are CSS custom properties
- zod for runtime validation at the API boundary; types are inferred from schemas
- clsx for class composition; lucide-react for icons
- MSW (Mock Service Worker) for mock APIs in dev and tests
- Vitest + React Testing Library + jsdom
- ESLint + Prettier + Steiger (Feature-Sliced Design linter)
- Pre-approved on first real need: `react-hook-form` + `@hookform/resolvers` (forms with 3+ fields); headless Radix primitives (`@radix-ui/react-dialog`, `-dropdown-menu`, `-popover`, `-tabs`) used ONLY inside `shared/ui` wrappers.
- Forbidden without my explicit approval: UI kits (MUI, Chakra, Ant, shadcn), Tailwind, CSS-in-JS, Redux/Zustand or any global store, axios, moment/dayjs/date-fns (use `Intl`), lodash, Storybook, and any other new dependency. If you think one is needed, ask first with the reason and the smallest alternative.

## 3. Architecture: Feature-Sliced Design (FSD)

Layers, top to bottom: `app > pages > widgets > features > entities > shared`.

- A module may import only from layers strictly below its own.
- Never import sideways between slices of the same layer. Compose them in a higher layer (page or widget).
- `app` and `shared` have no slices, only segments.
- Every slice exposes a public API in `index.ts`. Import another slice only through it: `import { X } from "@/entities/classification"`. Never deep-import.
- Inside a slice use relative imports. Across slices use the `@/` alias.
- Segments: `ui`, `model` (types, zod schemas, constants, pure logic, state hooks), `api` (requests, query keys, query/mutation hooks), `lib`, `config`.
- Queries live in `entities/*/api`. Mutations live in `features/*/api` and invalidate entity query keys.
- Domain knowledge (statuses, confidence bands, code formats) lives in entities. `shared` knows nothing about the domain.
- Create a slice only when a page needs it. Do not pre-create empty slices. Do not over-slice: group closely related actions in one feature.
- Slice map, routes and decision tree: docs/architecture.md. `npm run fsd` (Steiger) must pass.

## 4. Styling (SCSS Modules)

- Every component has `Name.module.scss` beside it, imported as `styles`. Class names are camelCase.
- Start each module with `@use "@/shared/styles/abstracts" as *;`. Never use `@import`.
- Colors, spacing, radius, shadows, type sizes and z-index come from CSS custom properties defined in `shared/styles/base/_tokens.scss` and documented in design.md. No raw hex/rgb values and no ad-hoc spacing literals in component styles. Fixed sizes that design.md lists (control height, drawer width, etc.) are allowed.
- SCSS is for nesting (max 3 levels), mixins (`respond-below`, `focus-ring`, `truncate`, `visually-hidden`) and functions. Do NOT create SCSS color variables; colors exist only as CSS variables.
- Desktop-first. Breakpoints come from Figma: 1000px (tablet) and 720px (mobile) via `@include respond-below($bp-tablet)` / `$bp-mobile`.
- Variants and states: `clsx` + module classes, or `data-*` / `aria-*` attributes. Inline styles only for dynamic values, passed as a CSS custom property.
- No `!important` (except `visually-hidden` and reduced-motion overrides). No global selectors outside `shared/styles`.
- Pages and widgets never restyle shared/ui internals. If a new look is needed, add a variant to the shared component.
- Motion: opacity fades of 200-250 ms ease-out only. Respect `prefers-reduced-motion`.

## 5. Components

- `shared/ui/<Name>/{Name.tsx, Name.module.scss, Name.test.tsx, index.ts}`. Presentational, domain-free, typed props, spreads native props, `forwardRef` where it makes sense, accessible by default.
- Before creating any component, check docs/component-inventory.md and search the code. Reuse or extend; never duplicate.
- After adding or changing a shared component, update docs/component-inventory.md and the dev-only `/_kit` page.
- Domain-aware wrappers (e.g. `ClassificationStatusBadge`) live in the entity `ui` segment and compose shared/ui.
- Changing the API of a shared component used by more than one page needs my approval.

## 6. Data and API

- UI components never import mock data. They call hooks from `entities/*/api` or `features/*/api`.
- All HTTP goes through `shared/api/http.ts` (fetch wrapper: base URL from env, JSON, normalized `ApiError`, auth-header hook).
- Every response is parsed with the entity's zod schema at the boundary. TS types are `z.infer` of those schemas.
- Mock mode: `VITE_USE_MOCKS=true` starts MSW from `src/app/mocks` (handlers + fixtures). Handlers mirror docs/api-contract.md paths exactly and return data that passes the schemas. Switching to the real backend means `VITE_USE_MOCKS=false` and `VITE_API_BASE_URL`. No UI, hook or business-logic change.
- Mock data must be realistic (real HS codes, plausible product descriptions), internally consistent (counts derive from data, never hard-coded in copy), with simulated latency (300-700 ms) and simulable errors. Anything fake that looks like a claim (accuracy figures, ruling references, model versions) renders `<SampleLabel />`.
- Contract changes: update docs/api-contract.md first, then schemas, then handlers.
- Query keys come from key factories in `entities/*/api/*.keys.ts`.

## 7. TypeScript and code standards

- Strict mode. No `any` (use `unknown` and narrow). No non-null `!` unless provably safe. No enums (use union types or `as const`).
- Function components and hooks only. Named exports only (lazy pages: `lazy(() => import(...).then(m => ({ default: m.XPage })))`).
- No barrel files except slice `index.ts`. No circular imports. No commented-out code. Comments explain why, not what.
- Handle loading, empty and error states on every data-driven view using the shared Skeleton / EmptyState / error patterns.
- Accessibility baseline: semantic HTML, labels for every input, visible `:focus-visible`, full keyboard operation (tables rows, menus, modals), Esc closes overlays, focus trapped in modals, `aria-live` for toasts, color never the only signal, WCAG AA contrast.

## 8. Naming

- Slice and route folders: `kebab-case` (`classification-detail`). Components and their files: `PascalCase`. Hooks: `useThing.ts`. Other files: `camelCase.ts`, with a role suffix where useful (`classification.schema.ts`, `classification.keys.ts`).
- Props types: `NameProps`. Booleans: `isX` / `hasX`. Event props `onX`, handlers `handleX`.
- Tests: `Name.test.tsx` beside the file. SCSS: `Name.module.scss`. CSS variables: `--kebab-case`.
- Route paths come from `shared/config/routes.ts`. No hard-coded paths in components.
- Never use the em dash anywhere (UI copy, docs, code comments, test names, commit messages); use a plain hyphen with spaces ( - ) or a comma instead.

## 9. Figma fidelity

Layout and copy come from the page brief and Figma; all visuals (color, font, radius, shadow) come only from design.md. Do not invent, redesign or "improve" UI that already exists in the design. Reference order:

1. The approved page brief `docs/pages/<page>.md`.
2. Figma via the Figma MCP, for layout and copy only. File: https://www.figma.com/make/v8wpvjs0lOovob7BIzYKzu/HS-Copilot-Classification-Workspace (fileKey `v8wpvjs0lOovob7BIzYKzu`, node `0:1`). For Figma Make files use the fileKey from the URL and nodeId `0:1` with `get_design_context`. Treat returned code as a reference to port, not code to paste.
3. `design/screens/<page>-<viewport>.png` and `design/make-export/` for layout and copy only - neither is a visual reference; their colors, fonts, radius and shadows are stale.
4. design.md for every visual value.

- Port into FSD + SCSS Modules and reuse shared/ui. Do not copy the prototype's single-file structure, plain CSS, timers or static data.
- Match copy, spacing, sizes and responsive behavior from Figma/the export; match colors, fonts, radius and shadows from design.md. If something is missing or ambiguous, ask. Never fill the gap with your own design.
- Report every deliberate deviation at the end of a task.

## 10. Prototype corrections (behavior that must differ from the Make prototype)

- Override keeps the decision final with `overridden: true`. Reject is a separate action.
- Counts and derived copy come from data ("2 need attention" is computed).
- No `window.alert` / `confirm`; use Modal and Toast.
- The "server waking up" screen is driven by a real `/health` check, not a timer.
- Navigation uses router URLs so the browser Back button and deep links work.
- Row action menus render in a portal and flip near viewport edges; table rows are keyboard-operable.

## 11. Workflow

One page or feature per task. Sequence: `/figma-page <slug>` (brief, no code) -> I approve -> `/new-page <slug>` (plan, then implement) -> `/check-architecture` -> I review. Full details and Definition of Done: docs/workflow.md.

## 12. Scope discipline (no drift)

- Do only what was asked. No refactors, renames, dependency changes, config changes or design changes outside the request. If you see something worth changing, propose it and wait.
- Before editing, list the files you will create or modify. Do not touch unrelated files.
- Never edit `design/` (read-only). Never read `.env`.
- Never run git write commands (`add`, `commit`, `push`, `pull`, `checkout`, `switch`, `merge`, `rebase`, `reset`, `stash`, `tag`) or the `gh` CLI. Read-only `git status`/`diff`/`log` is allowed. I do all git and GitHub work myself.
- When a task is done, end with a suggested commit message (Conventional Commits), nothing else git-related.
- Never run `npm run format` project-wide - it reformats unrelated files. Format only the files you changed: `npx prettier --write <files>`.
- Ask before: adding dependencies, creating a new top-level folder or layer-level convention, changing tokens, changing shared component APIs, changing tooling config (vite, tsconfig, eslint, steiger).

## 13. Commands

`npm run dev` | `build` | `typecheck` | `lint` | `format` | `format:check` | `fsd` | `test` | `check` (typecheck + lint + fsd + test). `npm run check` must pass before you report a task as done.

## 14. Performance and quality

- Lazy-load every route with `React.lazy`. Manual chunks only for vendor code, not app code.
- No runtime CSS-in-JS. No icon-set barrel imports - import only the icons actually used (e.g. `import { Check } from "lucide-react"`, never `import * as Icons`).
- No new dependencies without asking first.
- Self-host Inter with `font-display: swap`, max 2 weights.
- Responsive: mobile-first behavior at the 1000px and 720px breakpoints. No fixed widths. Touch targets >= 40px.
- Every list renders with stable keys. Memoize only when measured to help, not by default.
- Every component keeps strict TS: no `any`, no lint-rule suppression.
