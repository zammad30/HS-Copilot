# Page brief: Methodology

Status: approved
Route: `/methodology` | FSD slice: `pages/methodology`

## Design reference

- Figma URL / node: https://www.figma.com/make/v8wpvjs0lOovob7BIzYKzu/HS-Copilot-Classification-Workspace (fileKey `v8wpvjs0lOovob7BIzYKzu`, node `0:1`) - same Make file as Landing; `get_design_context` returns resource links into the same frozen source already mirrored at `design/make-export/`, nothing new.
- Screenshots: `design/screens/methodology.png` (desktop, 1440px), `design/screens/methodology.mobile.png` (375px). No tablet screenshot; confirmed below that this page has no distinct ≤1000px rule either.
- Make source screen: `design/make-export/src/App.tsx` lines 798-912, function `Methodology` (per `docs/make-export-index.md`). Styles: `design/make-export/src/index.css` lines 105-129 (`.mono`/`.eyebrow`/`.caption` utilities), 620-736 (`.article-page`, `.method-grid`, `.method-step`, `.test-set`, `.big-number`, `.chart-section`, `.bar-chart`, `.bar-row`), plus the 720px overrides at 2456-2478.
- **Colors and button styles are taken from `design.md`, not from the export/screenshots** - both still show the pre-"Customs Paper" palette (per this task's instruction, and per the note already added to `design.md` §1).

## Purpose and user goal

Public accuracy/methodology page. Builds trust by explaining how the agent reaches a suggestion (4-step process) and showing the current held-out evaluation numbers, both overall and broken down by tariff chapter - while being explicit that every number is sample/placeholder data until a real evaluation pipeline exists.

## Layout and sections (top to bottom, with spacing/columns)

1. **Public nav** - decided: reuse the exact same full marketing nav as Landing (Logo + "Methodology"/"Sign in"/"Open demo" + hamburger + mobile menu on ≤720px), via `widgets/public-shell`, no `variant` prop. The export/screenshot show a stripped-down "Back home only, no mobile menu" nav for this screen - deliberately not followed, per this decision.
2. **Article header** - `PageHeader`: eyebrow "Methodology & accuracy", H1 "A transparent process, built for review.", description (max 680px), no action. Bottom margin before the grid.
3. **Method grid** - 7/5 column grid, `space-8` gap.
   - Left (prose): H2 "How the agent works", then 4 numbered rows, each a 2-column grid (40px circle | content), top border, `space-3` vertical padding: a 32×32 circle (1px ink border, radius 8, centered number, 12/16 500) + H3 + body paragraph.
   - Right: a `Card` ("Current evaluation" panel), `space-4` padding, height fit-content:
     - Eyebrow "Current evaluation" + inline `SampleLabel`.
     - A big number, 48/56, ink, tabular-nums: "3,200".
     - A sentence: "expert-reviewed records, stratified across 47 tariff chapters and withheld from prompt and retrieval tuning."
     - A `<dl>` of 4 label/value rows (top border, each row bottom-bordered, 12px vertical padding, 14/20): Snapshot → "US HTS 2026 rev. 12"; Top-1 exact → "84.1%"; Top-3 recall → "92.4%"; Last updated → "7 Nov 2026".
4. **Chart section** - margin-top 112px (mobile: `space-10`/80px).
   - Section heading: eyebrow "By tariff chapter", H2 "Top-3 recall" + inline `SampleLabel`.
   - A bar chart, top-bordered, `space-6` margin-top: 5 rows, each `space-2` gap, min-height 56px, bottom-bordered: chapter code (monospace, tabular-nums) | chapter name | track+fill bar (8px tall, radius 8, `--line` track / `--accent` fill, width = value%) | bold percentage (tabular-nums, right-aligned). Decided: each bar gets `role="img"` and an `aria-label` like "Knitted apparel, 94 percent" (the track+fill div itself, not the row), since the visual bar is otherwise just a decorative width with no accessible text of its own - the code/name/percentage text nodes are already readable, but the bar graphic needs its own label.
   - Caption below (max 72ch): "Accuracy varies by product detail and chapter complexity. Confidence is calibrated separately and should not substitute for review."
5. **Footer** - same `PublicFooter` as Landing (no change).

No waking/cold-start screen on this page (confirmed out of scope by this task's instruction).

## Exact copy

- Nav: none page-specific - same copy as Landing's header ("Methodology", "Sign in", "Open demo", mobile menu's "Privacy"/"Terms"/"Open demo workspace").
- Eyebrow: "Methodology & accuracy"
- H1: "A transparent process, built for review."
- Description: "We evaluate the classifier on product records it has not seen during development, and publish the limits alongside the results."
- H2: "How the agent works"
  - 1 "Extracts product facts" - "Identifies composition, function, construction, and presentation from the description and attachments."
  - 2 "Builds a candidate set" - "Retrieves relevant heading text, section notes, explanatory notes, and analogous rulings."
  - 3 "Applies classification rules" - "Tests candidates against the General Rules of Interpretation and jurisdiction-specific guidance."
  - 4 "Surfaces uncertainty" - "Returns ranked suggestions, evidence, confidence, and questions where decisive facts are missing."
- Evaluation card eyebrow: "Current evaluation" + "Sample data"
- Big number: "3,200"
- Card body: "expert-reviewed records, stratified across 47 tariff chapters and withheld from prompt and retrieval tuning."
- dl: "Snapshot" → "US HTS 2026 rev. 12"; "Top-1 exact" → "84.1%"; "Top-3 recall" → "92.4%"; "Last updated" → "7 Nov 2026"
- Chart eyebrow: "By tariff chapter"; H2: "Top-3 recall" + "Sample data"
- Chapters (code, name, value%): 61 "Knitted apparel" 94%; 85 "Electrical equipment" 89%; 42 "Leather & travel goods" 87%; 73 "Articles of iron or steel" 85%; 39 "Plastics" 78%.
- Caption: "Accuracy varies by product detail and chapter complexity. Confidence is calibrated separately and should not substitute for review."

## Components

| Element                                                    | Component                                                             | Existing / New (+ proposed props)                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------- | --------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nav chrome, footer                                         | `widgets/public-shell` (`PublicHeader`, `PublicFooter`, `MobileMenu`) | **Extraction, first task of implementation** - move `pages/landing/ui/{PublicHeader,MobileMenu,PublicFooter}` into `widgets/public-shell` now that Methodology is a second consumer, per this task's explicit instruction. No `variant` prop: Methodology reuses the exact same full marketing nav as Landing, including the mobile menu. Steiger's `fsd/insignificant-slice` should no longer fire with 2 consumers. |
| Article header                                             | `PageHeader`                                                          | Existing. `eyebrow`, `title`, `description`, no `action`.                                                                                                                                                                                                                                                                                                                                                             |
| Section labels ("Current evaluation", "By tariff chapter") | `Eyebrow`                                                             | Existing.                                                                                                                                                                                                                                                                                                                                                                                                             |
| "Sample data" markers (2x)                                 | `SampleLabel`                                                         | Existing.                                                                                                                                                                                                                                                                                                                                                                                                             |
| Evaluation panel                                           | `Card`                                                                | Existing, `variant="default"` (shadow), padding via page className, same pattern as Landing's try-box.                                                                                                                                                                                                                                                                                                                |
| Numbered method steps                                      | page-local markup                                                     | Not an existing component; the numbered-circle/H3/paragraph row isn't documented as reusable in `design.md`'s component list. Page-local in `pages/methodology/ui`.                                                                                                                                                                                                                                                   |
| Evaluation `<dl>` rows                                     | page-local markup                                                     | Same reasoning - label/value row pattern not in the shared inventory yet.                                                                                                                                                                                                                                                                                                                                             |
| Per-chapter recall bar                                     | page-local markup, **not** `Meter`                                    | Decided: stays page-local, `Meter` unchanged. `Meter` (shared) is a 2px `--line`/`--ink` track with the percentage text _before_ the track; this chart's bars are 8px, rounded, `--accent`-filled, with code/name before and the percentage _after_ - a different, undocumented spec. Each bar carries `role="img"` + `aria-label` (e.g. "Knitted apparel, 94 percent") for accessibility.                            |

## Data

Decided: stand up a minimal `entities/evaluation` - `model/` only (zod schema matching `docs/api-contract.md`'s future `GET /evaluation/summary` shape, `isSample` included, plus the one hardcoded fixture), no `api/` segment since there's no live endpoint yet. Both Landing and Methodology import the fixture through `entities/evaluation`'s `index.ts`. Landing's page-local `pages/landing/model/evaluationSample.constants.ts` is retired as part of this task; its existing tests must keep passing against the new import. Fixture fields: `top3Recall` (92.4), `top1ExactMatch` (84.1), `reviewedTestCases` (3200), `humanControlledRate` (100, Landing-only), `htsSnapshot` ("US HTS 2026 rev. 12"), `lastUpdatedAt` ("7 Nov 2026"), `chapterRecall: { code, name, recallPercent }[]` (the 5 rows above), `isSample: true`.

No mutations, no MSW handlers.

## States

Static page, no network request - no loading/empty/error state needed.

## Interactions

- Nav/footer: identical to Landing's (Methodology/Sign-in/Open-demo/hamburger/mobile menu), all real routes.
- No forms, no overlays, no destructive actions on this page's own content.

## Responsive behavior (≤720px only - confirmed no distinct ≤1000px rule for this page, same as Landing)

- `article-page`'s top padding drops from 80px to 64px (bottom padding, 112px, is unaffected).
- `method-grid` collapses to 1 column; gap drops from `space-8` to `space-4`.
- `chart-section` margin-top drops from 112px to `space-10` (80px).
- `bar-row` reflows from a 4-column row (code/name/track/value) to 3 columns, with the track spanning full width on a second row below code/name/value.
- `page-header` (via `PageHeader`, already built) stacks - already implemented, no new work.

## Prototype corrections that apply here

- **#5 Navigation by state, not URL** - the shared header/footer already correct this (real `Link`/`useNavigate`, not `go()`).
- **#2 Hardcoded counts** - the chapter recall values, the 3,200 figure, and the evaluation `<dl>` are already `sample-label`-tagged in the prototype; kept hardcoded here (contract-shaped, `isSample: true`, via `entities/evaluation`) until a real evaluation API exists.
- Shortcuts #1, #3, #6 don't apply (no alert/confirm, no override/reject, no tables/menus). **#4 (waking-up timer) is explicitly out of scope for this page** per this task's instruction.

## Decisions (resolved 2026-11-11)

1. **Nav** - no `variant` prop on `PublicHeader`. Methodology reuses Landing's full marketing nav (incl. mobile menu) unchanged; the export's stripped-down "Back home only" nav is deliberately not followed.
2. **Evaluation data** - new minimal `entities/evaluation` (`model/` only: zod schema + fixture, `isSample` included, no `api/`), imported by both Landing and Methodology through its `index.ts`. Landing's page-local constants file is retired; its tests must keep passing against the new import.
3. **48/56 "Display" type** - `design.md` §3's restriction loosens from "landing hero only" to "hero and key stat numbers" (wording only, during implementation).
4. **Chart bar** - stays page-local; `Meter` unchanged. Each bar gets `role="img"` + an `aria-label` like "Knitted apparel, 94 percent" for accessibility.

## Acceptance criteria (testable)

- [ ] `widgets/public-shell` exists with `PublicHeader`, `PublicFooter`, `MobileMenu` moved out of `pages/landing/ui`; Landing's existing behavior and tests are preserved; Steiger passes with 2 consumers.
- [ ] Methodology renders the same full marketing nav as Landing (incl. mobile menu), not the export's stripped-down version.
- [ ] Renders the other 4 sections with the exact copy above, matching `methodology.png` / `methodology.mobile.png` at 1280 and 375 widths.
- [ ] All colors and button styles come from `design.md`'s current (Customs Paper) tokens - no colors copied from the export/screenshots.
- [ ] `entities/evaluation` exists (model-only) and both Landing and Methodology import the fixture through it; Landing's local constants file is removed and its tests still pass.
- [ ] Chapter recall values and the evaluation `<dl>` render through `SampleLabel`, backed by contract-shaped fields (`isSample: true`).
- [ ] Each chart bar has `role="img"` + a descriptive `aria-label`.
- [ ] No waking/cold-start UI on this page.
- [ ] No raw hex/off-scale spacing in new SCSS; any new components have tests + `/_kit` entries; `docs/component-inventory.md` updated.
- [ ] `npm run check` passes.
- [ ] Responsive: single collapse point at 720px, verified at 375/768/1280.

**Landmarks (step 7b)**: `<main id="main-content">`; `PublicHeader` renders the "Skip to main content" skip link first.
