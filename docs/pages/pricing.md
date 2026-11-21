# Page brief: Pricing

Status: approved (redesigned from a comparison table to three plan cards)
Route: `/pricing` | FSD slice: `pages/pricing`

## Design reference

- Figma URL / node: none. There is no Figma design for Pricing; layout comes from the task prompt and every visual value from `design.md`.
- Screenshots: none.
- Make source screen: none.

## Purpose and user goal

A public page where a visitor compares the three plans (Free, Solo, Team) and starts with one. A signed-in user sees which plan they are on. The numbers are demo data, and the page says so plainly.

## Layout and sections (top to bottom, with spacing/columns)

Same public chrome as Privacy and Terms: `PublicHeader`, `MobileMenu`, `PublicFooter` from `widgets/public-shell`, composed inside the page.

1. **Page header** - centered: `Eyebrow` "Pricing", H1, description (max 680px, centered). Page-local markup, because shared `PageHeader` is left-aligned and shared/ui is not changed. If the workspace request fails (signed in only), one muted line "We could not load your current plan." sits under the description.
2. **Plan cards** - three `<section>` elements (labelled by plan name) in a row, centered, container max-width 1040px, gap 24px, equal height. At 720px and below they stack in one column. Each holds a shared `Card` (default variant; `selected` for the current plan) with, top to bottom:
   1. Plan name (H2 size 20/28, 600, `--ink`)
   2. Tagline (14/20, `--muted`), page-local copy keyed by plan id: free "To try the product", solo "For one reviewer", team "For a small team"
   3. Price (28/36 600, `--ink`) with "per month" beside it (13/20, `--muted`)
   4. 1px `--line` divider
   5. Feature list (`<ul>`), the same six rows in the same order in every card: classifications, people, batch uploads, second approver, audit trail kept for, API access.
   6. Action area pinned to the bottom of the card (`margin-top: auto`, 24px above it), min height 40px (see Buttons and session). Cards stay equal height.
3. **Footnotes** - left-aligned to the card row's left edge (same 1040px container): `SampleLabel`, the demo line, then the three notes as plain paragraphs (Body 16/26, `--text`, max-width 72ch, 8px gap, no bullets).

Container: `shell-width` (min(100% - 64px, 1280px)), centered, top padding `--space-10` (mobile `--space-8`), bottom 112px. 4px radius, no gradient, no animation. The plan cards (and only they) use the soft `--shadow-card`, set on the card wrapper, with no hover effect. The name, tagline and price form one heading block so prices line up across the cards. No "most popular" tag, billing toggle, logos, badges or pills.

## Exact copy

- Eyebrow: "Pricing"
- H1: "Plans and limits"
- Description: "Compare what each plan includes. The figures below are sample data while the product is in development."
- Price: `Intl.NumberFormat` currency USD from `priceMonthlyCents / 100`, no fraction digits when whole: "$0", "$14.99"; "per month" is separate text beside it.
- Feature rows (all from data via `pages/pricing/lib/formatPlan.ts`, none hardcoded except API access and "Second approver"):
  - Classifications: "5 classifications in total" (lifetime) or "500 classifications per month".
  - People: "1 person", otherwise "Up to 5 people".
  - Batch: "3 batch uploads per month, up to 50 rows each", or "No batch upload" when both `uploadsPerMonth` and `maxRows` are 0.
  - Second approver: "Second approver" (included only when `secondApprover` is true).
  - Audit trail: "Audit trail kept for 30 days" / "1 year" / "24 months" (`Math.round(days / 365 * 12)` months from 366 days up).
  - API access: static "API access (planned)", never data. Always not included.
- Included item: lucide `Check` (16px, `aria-hidden`) plus visually-hidden "Included:". Not included item: lucide `Minus` (`aria-hidden`), `--muted` text, plus visually-hidden "Not included:".
- Demo line: "This is a demo. No payments are taken."
- Notes:
  1. "Batch rows count against your monthly classification limit. A batch that would go over the remaining limit is refused before it starts."
  2. "Records and their audit trail are deleted after the retention period, so save what you need to keep before then."
  3. "Everyone who uses the product needs an account."
- Plans error: `ErrorState` title "We couldn't load plans", retry label "Try again".
- Document title: "Pricing | HS Copilot" (via `useDocumentTitle`).

## Buttons and session

Session comes from `useSession()` (`entities/session`, returns `Session | null`).

- Signed out: every card has one primary `Button` "Get started" (full width) that navigates to `routes.signUp` with `onClick`. No plan is recommended. `GET /workspace` is not called (`useWorkspace({ enabled: false })`).
- Signed in: `useWorkspace()` gives the current plan id.
  - Current plan card: `Card` variant `selected`, a non-interactive full-width box (40px high, 1px `--line` border, `--radius`, centered "Current plan", 14/20 500 `--ink`), not a button and not focusable.
  - Other cards: one full-width primary `Button`, "Upgrade plan" if the plan's `priceMonthlyCents` is higher than the current plan's, "Downgrade plan" if lower. Click shows an info toast (`useToast`) "Plan changes are not available in this demo." No navigation, request or state change.
  - Workspace loading: a `Skeleton` in the action area.
  - Workspace error: the action area is empty and the muted line under the header is shown.

## Components

| Element                     | Component                                                            | Existing / New                                                                |
| --------------------------- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Header, mobile menu, footer | `widgets/public-shell`                                               | Existing                                                                      |
| Eyebrow                     | `shared/ui/Eyebrow`                                                  | Existing                                                                      |
| Plan card                   | `shared/ui/Card` (default, selected) inside a page-local `<section>` | Existing Card; `PlanCard` is page-local in `PricingPage.tsx`                  |
| Sample marker               | `shared/ui/SampleLabel`                                              | Existing                                                                      |
| Plan button, toast          | `shared/ui/Button` (primary), `shared/ui/Toast` (`useToast`)         | Existing                                                                      |
| Loading                     | `shared/ui/Skeleton`                                                 | Existing, three cards of skeleton lines; one skeleton line in the action area |
| Error                       | `shared/ui/ErrorState`                                               | Existing, `onRetry` wired to `refetch`                                        |
| Formatters                  | `pages/pricing/lib/formatPlan.ts`                                    | Page-local pure functions                                                     |

No new shared/ui components, and no change to any shared component.

## Data

- Entity: `entities/workspace`. `usePlans()` calls `GET /plans` (key `workspaceKeys.plans()`). `useWorkspace({ enabled })` calls `GET /workspace`; `enabled` defaults to true, so existing callers are unchanged.
- No mutations, no new endpoint. Mock data matches docs/api-contract.md's sample catalog. `PUT /__mock/plan` (mock only) changes which card is current.
- No plan number, price or limit appears in JSX.

## States

- Plans loading: three card-shaped skeletons. No spinner.
- Plans error: `ErrorState` with "Try again" calling `refetch`.
- Workspace loading / error: see Buttons and session.
- Empty: not needed (the catalog is fixed).

## Interactions

- Signed out: the three "Get started" buttons navigate to `routes.signUp`. Signed in: Upgrade/Downgrade buttons show an info toast.
- Header "Pricing" link and footer "Pricing" link navigate to `routes.pricing`.
- No modals or menus. The only toast is the plan-change info toast.

## Responsive behavior (<=1000, <=720)

- 1280: three equal cards, max-width 1040px, centered.
- <=720: one column, cards stacked. Page margins follow `StaticPage` (24px per side at 720).
- Check 375, 768 and 1280.

## Decisions (resolved)

1. Months for retention: `Math.round(days / 365 * 12)`.
2. Plan buttons are `Button` with `onClick` to `routes.signUp`. Accessibility debt: they should be real links (needs an `href` variant on shared `Button`, which requires approval).
3. Page header is page-local because shared `PageHeader` cannot be centered without changing it.
4. Plan card is the one card-grid exception, noted in design.md.

## Acceptance criteria (testable)

- [ ] `/pricing` is public, lazy-loaded, inside the public-shell chrome, document title "Pricing | HS Copilot".
- [ ] Three cards (Free, Solo, Team) from `GET /plans`; changing the handler's numbers changes the text.
- [ ] Each card has the same six feature rows with visually-hidden "Included:" / "Not included:" text.
- [ ] Signed out: three "Get started" buttons to sign-up, no `GET /workspace` request.
- [ ] Signed in: the current plan card is `selected` with a "Current plan" box and no button; the others show "Upgrade plan" or "Downgrade plan" by price, and a click shows the info toast without navigating.
- [ ] Action area sits at the bottom of each card, after the feature list.
- [ ] Workspace error: muted line, empty action area. Workspace loading: skeleton in the action area.
- [ ] `SampleLabel`, the demo line and the three notes are present.
- [ ] Skeleton while plans load; `ErrorState` with a working "Try again" on failure.
- [ ] Checked at 375 / 768 / 1280.
- [ ] `npm run check` passes.
