# Page brief: Landing

Status: approved
Route: `/` | FSD slice: `pages/landing`

> Layout restyled in the design reset; copy and behavior unchanged.

## Design reference

- Figma URL / node: https://www.figma.com/make/v8wpvjs0lOovob7BIzYKzu/HS-Copilot-Classification-Workspace (fileKey `v8wpvjs0lOovob7BIzYKzu`, node `0:1`) - now recorded in `CLAUDE.md` §9. Queried via `get_design_context`: for this Figma Make file the tool returns resource links into the same frozen source (`src/App.tsx`, `src/index.css`, etc.) already mirrored at `design/make-export/` - no new visual information beyond what the screenshots and make-export already give.
- Screenshots: `design/screens/landing.png` (desktop, 1440px), `design/screens/landing.mobile.png` (375px). No separate tablet screenshot exists; the Make CSS confirms landing only has one collapse breakpoint (720px - see Responsive section), so none is needed.
- Make source screen: `design/make-export/src/App.tsx` lines 611-796, function `Landing`. Styles: `design/make-export/src/index.css` lines 360-604 (plus the 720px overrides at 2381-2456).

## Purpose and user goal

Public marketing home page. Goal: explain what HS Copilot does, let a visitor try one product with zero friction (no account), build credibility with inspectable accuracy numbers, pre-empt the "is this legal advice / does this replace a broker" objections, and route the visitor to Methodology, Sign in, or the demo workspace.

## Layout and sections (top to bottom, with spacing/columns)

1. **Public nav** - height 80px, bottom border, flex row `space-between`. Left: `Logo`. Right (desktop): "Methodology" (text), "Sign in" (text), "Open demo" (filled button). Right (≤720px): hamburger icon button, nav links hidden.
2. **Mobile nav overlay** (≤720px only, hidden desktop) - full-screen fixed overlay, `space-3` padding, 200ms fade-in. Top row: `Logo` + close icon button. Below (after `space-10` gap, top border): a stacked nav list - Methodology, Sign in, Privacy, Terms, each a 64px-tall large (24/32, 600) left-aligned row with a bottom divider. Bottom: full-width "Open demo workspace" button pinned to the bottom (`margin-top: auto`).
3. **Hero** - `shell-width` container, 7/5 column grid, `space-8` column gap, min-height 650px, top padding 120px. Column 1: eyebrow, H1 (2 lines), body copy (max 620px). Column 2, spanning rows 2-4, vertically centered: the "try one product" card.
   - Try-box card: `space-4` padding, bordered, radius 8, shadow. Label "Try one product" above an input+button row (input flex-grows, button is fixed width with a leading arrow icon), helper sentence below.
4. **How it works** - `shell-width`, `section-block` (112px vertical padding). Section heading (eyebrow + H2, max 620px). Below (`space-8` gap), a 3-column grid of numbered steps, each with a 2px top border in ink, a number (01/02/03), an H3, and a body paragraph (max 36ch).
5. **Accuracy** - full-bleed `--surface` background band, inner content `shell-width`, 1/1 column grid (`space-10` gap), vertically centered. Left: eyebrow, H2, a sentence ending in an inline `SampleLabel`, and a "Read our methodology →" text link. Right: a relatively-positioned stats block - a `SampleLabel` pinned top-right (absolute, overlapping the top edge), and a 2×2 stat grid with hairline borders between cells; each cell has a large tabular-numeral stat and a caption below it.
6. **FAQ** - `shell-width`, `section-block`, 5/7 column grid (`space-8` gap). Left: eyebrow + H2 ("Important context" / "Designed to support professional judgment"). Right: a list of 3 disclosure rows (native accordion), each with a top divider, a summary row (question text + a trailing `+` icon, `space-between`), and - when open - an answer paragraph (max 64ch) below.
7. **Footer** - top border, min-height 120px, `space-between` row (desktop): `Logo`, tagline copy, and a link row (Methodology, Privacy, Terms, "© 2026"). Stacks to a column on mobile.

## Exact copy

- Nav: "Methodology", "Sign in", "Open demo" (button).
- Mobile menu nav: "Methodology", "Sign in", "Privacy", "Terms"; button "Open demo workspace".
- Hero eyebrow: "Human-reviewed tariff classification"
- Hero H1: "Classify with evidence." / "Decide with confidence." (two lines, explicit break)
- Hero body: "HS Copilot researches tariff codes, explains its reasoning, and keeps a human reviewer in control of every final decision."
- Try-box label: "Try one product"
- Try-box default input value: "Men's 100% cotton knitted crew-neck T-shirt"
- Try-box button: "Classify" (with leading arrow icon)
- Try-box helper text: "No account required. Results are suggestions, not legal advice."
- How-it-works eyebrow: "How it works"; H2: "From product detail to a reviewable decision"
  - Step 01 "Describe" - "Add the product, material, intended use, and origin when known."
  - Step 02 "Research" - "The agent compares tariff text, rules, and relevant past rulings."
  - Step 03 "Review" - "Approve, override, or ask for more information before finalizing."
- Accuracy eyebrow: "Measured, not assumed"; H2: "Accuracy you can inspect"
  - Body: "Evaluated against a held-out set of reviewed classifications across 47 chapters. [Sample data]"
  - Link: "Read our methodology →"
  - Stats: "92.4%" / "Top-3 code recall", "84.1%" / "Top-1 exact match", "3,200" / "Reviewed test cases", "100%" / "Human-controlled finals" - all under one "Sample data" label.
- FAQ eyebrow: "Important context"; H2: "Designed to support professional judgment"
  - Q: "Is a suggested code final?" - A: "No. Every output remains a suggestion until a designated reviewer approves it."
  - Q: "Does this replace a customs broker?" - A: "No. HS Copilot organizes research and evidence; your qualified team owns the decision."
  - Q: "Which jurisdictions are supported?" - A: "The demo uses the US HTS. Additional national tariff schedules can be configured by workspace."
- Footer tagline: "AI-assisted research. Human-reviewed decisions."
- Footer links: "Methodology", "Privacy", "Terms", "© 2026"

## Components

| Element                                                                                  | Component                                                                 | Existing / New (+ proposed props)                                                                                                                                                                                                                                                                                                                               |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Wordmark (nav, mobile menu, footer)                                                      | `Logo`                                                                    | Existing. `onClick` navigates home.                                                                                                                                                                                                                                                                                                                             |
| "Open demo" / "Open demo workspace"                                                      | `Button`                                                                  | Existing. `variant="primary"`.                                                                                                                                                                                                                                                                                                                                  |
| "Classify" (try-box submit)                                                              | `Button`                                                                  | Existing. `variant="primary"`, `icon={<ArrowRight />}`, `type="submit"`.                                                                                                                                                                                                                                                                                        |
| Hamburger / close (mobile menu)                                                          | `IconButton`                                                              | Existing. `aria-label="Open menu"` / `"Close menu"`.                                                                                                                                                                                                                                                                                                            |
| Try-box input + label                                                                    | `FormField` + `TextInput`                                                 | Existing. No error state on this page.                                                                                                                                                                                                                                                                                                                          |
| Try-box container                                                                        | `Card`                                                                    | Existing, `variant="default"` (shadow). Padding applied via page-level className (same pattern as `/_kit`).                                                                                                                                                                                                                                                     |
| "Sample data" markers (3x: methodology sentence, stats block)                            | `SampleLabel`                                                             | Existing.                                                                                                                                                                                                                                                                                                                                                       |
| Section labels ("How it works", "Measured, not assumed", etc. - 4x)                      | `Eyebrow`                                                                 | **New.** Listed `planned` in the inventory; this page is the first consumer. Proposed: `interface EyebrowProps extends HTMLAttributes<HTMLParagraphElement> {}`, renders a `<p>`, 12/16 500 uppercase, 0.08em tracking, `--muted` color (design.md §3) - token-only SCSS, no variants needed yet.                                                               |
| "Methodology" / "Sign in" / "Privacy" / "Terms" nav text links                           | react-router `Link`                                                       | Not a shared component - plain text nav links, unstyled in the prototype (`.public-nav__links > button:not(.button)`). Lives inside `widgets/public-shell`.                                                                                                                                                                                                     |
| FAQ disclosure rows                                                                      | native `<details>`/`<summary>` + `Plus` icon                              | Page-local markup (decided: no new shared component). Add a visible `:focus-visible` ring on `summary` (token `focus-ring` mixin) since the prototype has none.                                                                                                                                                                                                 |
| Public header (`Logo` + nav links + "Open demo" + hamburger), mobile nav overlay, footer | Page-local: `pages/landing/ui/{PublicHeader,MobileMenu,PublicFooter}.tsx` | Initially built as `widgets/public-shell`, but Steiger's `fsd/insignificant-slice` correctly flagged a widget with exactly one consumer - moved into `pages/landing/ui/` as three page-local components instead (same markup, same tests, no Steiger override). Re-extract into a real `widgets/public-shell` once Methodology/Auth/Legal need the same chrome. |

No existing shared/ui component is duplicated. `DataTable`, `Modal`, `Menu`, `Drawer`, `Tabs`, `Toast` are irrelevant to this page.

## Data

No entity and no network request for this page. Decided: hardcode the 4 accuracy stats in one page-local constants file (`pages/landing/model/evaluationSample.constants.ts` or similar), shaped with the same field names `docs/api-contract.md`'s future `GET /evaluation/summary` will use (`topKAccuracy`/`top1Accuracy`/`testCaseCount`/`humanControlledRate` or equivalent, plus `isSample: true`) so swapping in the real entity later is a rename, not a redesign. Each stat renders through `SampleLabel`. No entity, no query key, no MSW handler added by this task.

No mutations.

## States

Static marketing content, no network request - no loading/empty/error state needed for this page.

## Interactions

- Nav "Methodology" → `/methodology`. "Sign in" → `/signin`.
- "Open demo" / "Open demo workspace" → `/app` when `VITE_USE_MOCKS=true` (auto-provisioned mock session via `entities/session`), otherwise → `/signin`. The cold-start "waking" presentation on first entry into `/app` is driven by a real `GET /health` check, never a timer (prototype shortcut #4 corrected here).
- Hamburger opens the mobile overlay; close button or clicking a nav link inside it closes it. **Correction added**: the prototype's overlay has no Esc-to-close and doesn't return focus to the hamburger button on close - CLAUDE.md §7 requires both for any overlay; `widgets/public-shell` adds them.
- Try-box: controlled `TextInput` (default-filled with the sample description). On submit: trim the value; if empty, show an inline `FormField` error ("Enter a product description.") and do not navigate; otherwise cap the trimmed length (reuse the same max the `/try` brief will define - truncate silently rather than block submission) and navigate to `/try?q=<encoded trimmed text>`.
- "Read our methodology →" → `/methodology`.
- FAQ rows: native disclosure toggle (click summary, or Enter/Space when focused - native `<details>` already gives this for free); visible focus ring added on `summary`.
- Footer links: same destinations as nav (Methodology, Privacy, Terms).

## Responsive behavior (≤720px only - the Make CSS has no distinct ≤1000px rule for this page)

- Public nav drops to 64px height; text links hidden, hamburger shown.
- Hero becomes a single column (no grid); H1 drops to 40/48; try-box moves below the copy with a top margin, less internal padding, and its input+button row becomes stacked (button full-width) instead of inline.
- "How it works" steps, the accuracy 1/1 split, and the FAQ 5/7 split all collapse to a single column.
- Stat numbers shrink from 32/40 to 24/32; stat cell padding shrinks.
- Footer switches to a left-aligned column, tagline copy reordered after the link row (CSS sets `order: 3` on the footer paragraph).
- Section vertical padding drops from 112px to `--space-10` (80px).

## Prototype corrections that apply here

- **#5 Navigation by state, not URL** - every nav/footer/hero action here currently calls the prototype's in-memory `go(screen)`. The real page uses `react-router` `Link`/`useNavigate` against `shared/config/routes.ts` paths so Back/Forward and deep links work (e.g. a visitor can land directly on `/methodology` or `/signin`).
- **#2 Hardcoded stats** - the 4 accuracy numbers are already correctly `sample-label`-tagged in the prototype; keep that marking. Decided: stay hardcoded (page-local constants, `isSample: true`, contract-shaped field names) until `entities/evaluation` exists for real.
- **#4 Waking-up timer** - decided: "Open demo"'s entry into `/app` is driven by a real `GET /health` check, not the prototype's flat 2-second timeout.
- Shortcuts #1, #3, #6 (alert/confirm, override/reject, table/menu keyboard access) don't apply - this page has no destructive actions, no override/reject, no tables/row-menus.
- Additional baseline fix beyond the 6 listed shortcuts: mobile nav overlay needs Esc-to-close and focus-return-to-trigger (CLAUDE.md §7), which the prototype doesn't have - added in `widgets/public-shell`.

## Decisions (resolved 2026-11-10)

1. **Hero "Classify" destination** - `/try?q=<trimmed, length-capped text>`; empty input shows an inline `FormField` error instead of navigating.
2. **"Open demo" destination** - `/app` with an auto mock session when `VITE_USE_MOCKS=true`; otherwise `/signin`. Waking screen driven by the real `/health` check.
3. **Accuracy stats** - hardcoded in one page-local constants file, contract-shaped field names, `isSample: true`, rendered through `SampleLabel`. No entity this task.
4. **FAQ** - page-local native `<details>`/`<summary>`, with a visible focus ring added on `summary`. No new shared component.
5. **Chrome** - minimal header/footer/button-toggle mobile menu, no Radix, scoped to only what the prototype shows. Built page-local in `pages/landing/ui/` (not `widgets/public-shell`) after Steiger flagged a single-consumer widget slice; revisit as a widget once a second public page needs it.
6. **`Eyebrow`** - new `shared/ui/Eyebrow`, with test, `/_kit` entry, and inventory update.
7. **Figma file** - https://www.figma.com/make/v8wpvjs0lOovob7BIzYKzu/HS-Copilot-Classification-Workspace, now recorded in `CLAUDE.md` §9.

## Acceptance criteria (testable)

- [ ] Renders all 7 sections with the exact copy above, matching `landing.png` / `landing.mobile.png` at 1280 and 375 widths.
- [ ] All nav/footer/hero links are real `react-router` routes (verifiable by refresh/deep-link, not just click).
- [ ] Mobile hamburger opens the `MobileMenu` overlay; Esc and the close button both close it; focus returns to the hamburger afterward.
- [ ] Try-box input is a controlled `TextInput` wrapped in `FormField` with a visible label; empty submit shows an inline error and does not navigate; non-empty submit navigates to `/try?q=...` with the trimmed, capped text.
- [ ] "Open demo" navigates to `/app` (mock session) or `/signin` depending on `VITE_USE_MOCKS`.
- [ ] FAQ rows are keyboard-operable (native `<details>` gives this for free), show a visible focus ring on `summary`, and show/hide the answer correctly.
- [ ] No raw hex/spacing in new SCSS; `Eyebrow` and `widgets/public-shell` each have tests; `Eyebrow` has a `/_kit` entry; `docs/component-inventory.md` updated for both.
- [ ] `npm run check` passes.
- [ ] Responsive: single collapse point at 720px, verified at 375/768/1280 per `docs/workflow.md`'s Definition of Done (768 should look identical to 1280 here, since the Make CSS has no 1000px rule for this page - confirms nothing is missed, doesn't require new behavior).

### Known gaps

- `/try` is a placeholder page (no brief yet).
- Landing still passes the typed text in `?q=` to `/try`, which puts it in the URL. To fix in step 6b: save it with `pendingDescriptionDraft` (`entities/session`) instead and drop the query param.
- Home still hands text to Classify new through `?q=` (a signed-in handoff; debt).
