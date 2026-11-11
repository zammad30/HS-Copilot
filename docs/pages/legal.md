# Page brief: Legal (Privacy, Terms) and Not-found

Status: approved
Route: `/privacy` | `/terms` | `*` (catch-all) | FSD slices: `pages/legal` (Privacy + Terms), `pages/not-found` (separate slice — already the project's routing convention; the two never share code directly)

## Design reference

- Figma URL / node: https://www.figma.com/make/v8wpvjs0lOovob7BIzYKzu/HS-Copilot-Classification-Workspace (fileKey `v8wpvjs0lOovob7BIzYKzu`, node `0:1`) — same Make file; `get_design_context` returns only source-code resource links, no rendered screenshot.
- Screenshots: `design/screens/privacy.png`/`.mobile.png`, `terms.png`/`.mobile.png`, `not-found.png`/`.mobile.png` — all six exist and were checked.
- Make source: `design/make-export/src/App.tsx` — `StaticPage` (2916-2940, the shared wrapper Privacy/Terms both render inside), `NotFoundScreen` (2972-2983), the `privacy`/`terms` screen bodies (3080-3107).
- Styles: `design/make-export/src/index.css` lines 2212-2222 (`.legal-page`), 2224-2241 (`.flow-state`, shared by not-found/empty/error states), 2276-2287 (`.not-found`). No mobile-specific overrides exist for any of these three — single generic `shell-width`/`article-page` responsive behavior applies, same as every other public page.
- **Colors and button styles are taken from `design.md`** (Customs Paper), not the export, same as every prior page.

## Purpose and user goal

Privacy and Terms: minimal, legally-adjacent informational pages linked from the public footer. Not-found: a recoverable dead-end for any unmatched URL.

## `StaticPage` — is it shared, and where should it live?

Yes — in the export, **both** Privacy and Terms render through the same `StaticPage` wrapper (title + "Back" link + children). In our FSD structure, Privacy and Terms are two pages inside **one slice**, `pages/legal` (per `docs/architecture.md`'s existing slice map — this was already decided when the slice was scaffolded, not a new choice). Since both of `StaticPage`'s only consumers live inside that single slice, it should be **page-local**: `pages/legal/ui/StaticPage.tsx`, imported by `PrivacyPage.tsx`/`TermsPage.tsx` via a relative import — exactly the same reasoning and precedent as `pages/auth/ui/AuthShell.tsx` (shared by 3 pages in one slice) from the Auth task. It does **not** qualify as a `widgets/*` candidate: nothing outside `pages/legal` would ever consume it, so promoting it would just recreate the `fsd/insignificant-slice` situation already hit twice this project (`public-shell`, `features/auth`) for no benefit.

`NotFoundScreen` has no equivalent reuse question — `pages/not-found` is a separate slice with exactly one page, so there's nothing to share.

## Layout and sections (top to bottom, with spacing/columns)

### Privacy / Terms (via `StaticPage`)

1. **Header** — decided (per this task's instruction): reuse `widgets/public-shell`'s `PublicHeader` + `MobileMenu`, same as Landing/Methodology/Auth's back-home link — **not** the export's bare "Logo only, no links" nav. This is the same kind of deliberate deviation already made for Methodology's header.
2. **Back link** — "← Back" text-link, navigates to `/` (the export's `go("landing")`).
3. **Eyebrow** "HS Copilot", H1 (page title: "Privacy" / "Terms").
4. **Body** — a single-column block (max-width 760px, `space-3` gap between elements): intro paragraph, then one `h2` + paragraph subsection (see exact copy below).
5. **Footer** — decided (per this task's instruction): reuse `widgets/public-shell`'s `PublicFooter` — the export has **no footer at all** on these screens; this is a deliberate addition, not fidelity.

### Not-found

Decided: uses the full `widgets/public-shell` header and footer (deviation from the bare export/screenshots, same kind of deliberate addition as Privacy/Terms's footer). Below the header: a centered full-viewport state (`flow-state` pattern, shared visually with empty/error states elsewhere, though those aren't built yet): big accent "404", H1 "Page not found" (also the document `<title>`/page title), the message "The link may be outdated or the page may have moved.", and a "Back home" link to `/`. Decided specifics:
- No redirect — the catch-all route renders this page in place; it never auto-navigates anywhere.
- No typed path is echoed back (the export doesn't show the attempted URL either; not adding it).
- "Back home" is a real link to `/`, not a timed or automatic redirect.

## Exact copy — placeholder/sample legal text, not reviewed legal claims

**This body copy is placeholder text carried over verbatim from the frozen prototype. It is not legal advice, has not been reviewed by counsel, and must not be read as real policy.** Marking it clearly in the UI is part of this brief's scope (see below) — this is explicitly flagged per this task's instruction not to invent or imply real legal claims.

- Privacy — Eyebrow "HS Copilot", H1 "Privacy".
  - Intro: "We use workspace data only to provide classification research, review, and audit features. Access is limited to authorized workspace members."
  - H2 "Product data": "Uploaded product descriptions and supporting records remain within the workspace and can be exported or deleted by administrators."
- Terms — Eyebrow "HS Copilot", H1 "Terms".
  - Intro: "HS Copilot provides research suggestions to support qualified human review. Outputs are not legal advice and are not final customs determinations."
  - H2 "Reviewer responsibility": "Your organization remains responsible for checking evidence, approving classifications, and complying with applicable law."
- Back link: "Back".
- Not-found: "404", "Page not found" (also the page title), "The link may be outdated or the page may have moved.", link "Back home".
- Placeholder notice (Privacy and Terms, next to/under each page's H1): `SampleLabel` "Sample text" + "This page contains placeholder text and is not reviewed legal copy."

**Decided marking approach**: no `Banner`. `SampleLabel` next to the H1 reading "Sample text" (overriding its "Sample data" default via children, same pattern already used elsewhere for non-"data" sample markers), plus one plain sentence directly under the H1: "This page contains placeholder text and is not reviewed legal copy." No real legal claims are made anywhere on either page.

## Components

| Element | Component | Existing / New (+ proposed props) |
| --- | --- | --- |
| Header, mobile menu, footer (Privacy/Terms **and** Not-found) | `widgets/public-shell` | Existing, reused as-is on all three pages (decided — see Layout above). |
| "Back" link (Privacy/Terms), "Back home" link (Not-found) | react-router `Link` | Both are plain real-route links, matching `widgets/public-shell`'s own link styling pattern. Not-found's is a `Link`, not a `Button`, per this round's decision. |
| Placeholder-text notice | `SampleLabel` (existing, custom children "Sample text") + a plain paragraph | No new component — see decision above. |
| `StaticPage` wrapper | page-local, `pages/legal/ui/StaticPage.tsx` | New file, not a new design — ports the export's wrapper 1:1 (title + back-link + children), composed with `widgets/public-shell` per the decision above. |
| 404 big number + heading + message | page-local markup | Not a shared-component candidate (single consumer, matches the `flow-state` pattern that empty/error states will likely reuse later, but those don't exist yet — not pre-building for them). |

No new shared/ui components.

## Data

None. Fully static content, no entities, no mutations, no MSW.

## States

Static pages — no loading/empty/error states of their own. Not-found *is* itself the "page doesn't exist" state for the whole app.

## Interactions

- "Back" (Privacy/Terms) → `/` via `Link`.
- "Back home" (Not-found) → `/` via `Link`. No redirect, no timer — the catch-all route just renders this page; navigating away only happens on an explicit click.
- Footer/header links on all three pages → same as every other public page (real routes via `widgets/public-shell`).

## Responsive behavior

Single 720px breakpoint, same generic `shell-width`/`article-page` rules as every other public page already built — the export defines **no** page-specific mobile overrides for `.legal-page`, `.flow-state`, or `.not-found`. Nothing new to port here.

## Prototype corrections that apply here

- **#5 Navigation by state, not URL** — "Back"/"Back home" become real routes (already the established pattern via `widgets/public-shell` and `Button`+`navigate`).
- Shortcuts #1-#4, #6 don't apply (no forms, no destructive actions, no waking screen, no tables/menus).
- Not a numbered shortcut, but worth naming: the export's legal copy is placeholder — CLAUDE.md's "anything fake that looks like a claim renders `<SampleLabel />`" doesn't cleanly cover prose like this, hence the `Banner` proposal above rather than reusing `SampleLabel`.

## Decisions (resolved 2026-11-13)

1. **Not-found chrome** — uses the full `widgets/public-shell` header and footer, deviating from the bare export/screenshots (same kind of addition as Privacy/Terms's footer). No redirect, no typed-path echo, page title "Page not found."
2. **Placeholder notice** — no `Banner`. `SampleLabel` with custom children "Sample text" next to the H1, plus one plain sentence under it: "This page contains placeholder text and is not reviewed legal copy." No real legal claims anywhere on either page.
3. **Verified before approval**:
   - Footer links point at `routes.privacy`/`routes.terms` — confirmed in `widgets/public-shell/ui/PublicFooter.tsx:18-19`.
   - Heading order on Privacy/Terms is H1 → H2 with no skipped levels (via `StaticPage`'s structure).
   - Body line length: already globally capped at 72ch by the base `p { max-width: 72ch; }` rule (`shared/styles/base/_typography.scss:35-37`) — no page-specific work needed.

## Acceptance criteria (testable)

- [ ] `/privacy`, `/terms` render through a page-local `StaticPage` (in `pages/legal/ui`), with `widgets/public-shell`'s header/mobile-menu/footer and the exact copy above.
- [ ] Both pages show the `SampleLabel` "Sample text" next to the H1 and the plain placeholder-notice sentence under it; no real legal claims anywhere.
- [ ] Footer links on every page resolve to `/privacy` and `/terms`; heading order is H1 → H2 with nothing skipped; body paragraphs respect the existing global 72ch cap.
- [ ] `*` (catch-all, already wired in `router.tsx`) renders `NotFoundPage` with `widgets/public-shell` chrome, the exact copy above, page title "Page not found", a working "Back home" link to `/`, no redirect, and no typed path shown.
- [ ] All navigation is real routes, not state.
- [ ] No raw hex/off-scale spacing in new SCSS; `docs/component-inventory.md` updated only if `StaticPage` changes the inventory (it won't — it's page-local, not shared).
- [ ] `npm run check` passes.
- [ ] Responsive: single collapse point at 720px, verified at 375/768/1280 against the six existing screenshots.
