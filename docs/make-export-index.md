# Make-export index: `App.tsx`

Reference only. Maps every screen, shared component, constant and mock-data block in the frozen Figma Make export to its line range, plus the prototype shortcuts the real app must fix.

**Frozen file:** `design/make-export/src/App.tsx`
**Line count:** 3200 (newline-terminated lines; file ends with a trailing newline)
**SHA-256:** `5bb56bb6189aae14e3b760b0ffb7e6832d78e25c454d2f8fe1fc6700ea6823ed`

The line ranges below apply only to the file matching that hash. If the hash no longer matches, every range in this document may be stale — recompute (`Get-FileHash design\make-export\src\App.tsx -Algorithm SHA256`) and re-derive the ranges before trusting this index.

## Types and constants

| Name | Lines | Purpose |
|---|---|---|
| `Screen` | 45-61 | Union of every screen/route key the prototype's internal router switches on |
| `Status` | 63 | The four classification statuses (`Approved`, `Rejected`, `Needs review`, `Pending`) |
| `Product` | 64-77 | Shape of one mock classification record (code, confidence, citations, reasoning, ruling, etc.) |
| `sampleProduct()` | 79-106 | Factory that fills in derived fields (citations, tariff text, reasoning, ruling) for a `Product` from a few inputs |
| `products` | 108-235 | The 14 seed `Product` records the whole prototype runs on |
| `navItems` | 1051-1056 | Sidebar nav entries (Workspace, New classification, Batch review, Library) |
| `ToastTone` / `ShowToast` | 1569-1570 | Toast tone union and the toast-dispatch function signature |
| `Member` | 2460-2466 | Shape of one team-member record used in Settings → Members |

## Shared components (shared/ui equivalents)

| Name | Lines | Purpose |
|---|---|---|
| `Button` | 237-263 | Primary/secondary/approve/reject/ghost button with optional icon |
| `TextInput` | 265-285 | Labelled text/number/email input with error text |
| `SelectField` | 287-297 | Labelled native select with chevron icon |
| `StatusChip` | 299-312 | Status badge (icon + label) for the four `Status` values |
| `Confidence` | 314-323 | Percentage text + 2px track meter |
| `Card` | 325-327 | Generic white bordered section wrapper |
| `PageHeader` | 329-350 | Eyebrow + title + description + optional right-side action |
| `Modal` | 352-390 | Dialog with Esc-to-close and backdrop click-to-close |
| `PortalMenu` | 392-426 | Row-action menu rendered in a portal, flips near viewport edges |
| `ProductTable` | 428-601 | Classification table: rows, row menu, selection, delete-confirm modal |
| `Logo` | 603-609 | "HS Copilot" wordmark button |
| `FilterDropdown` | 2111-2161 | Multi-select checkbox filter dropdown (status/confidence) |
| `Toggle` | 2468-2487 | Labelled on/off switch row |

## Composite/widget components

| Name | Lines | Purpose |
|---|---|---|
| `SideNavigation` | 1058-1101 | Sidebar nav links + settings/sign-out, reused by desktop and mobile drawer |
| `AppShell` | 1103-1330 | App-wide layout: sidebar, topbar, workspace/help/profile menus, keyboard shortcuts modal |
| `ClassificationExplorer` | 2163-2321 | Search + filters + paginated table + bulk-action bar; shared by Batch review and Library |
| `StaticPage` | 2916-2940 | Public legal-page shell (logo, back link, title) used by Privacy and Terms |

## Screens (page equivalents)

| Name | Lines | Purpose |
|---|---|---|
| `Landing` | 611-796 | Public marketing home: hero, try-box, how-it-works, accuracy stats, FAQ |
| `Methodology` | 798-912 | Public methodology/accuracy page with per-chapter recall chart |
| `Auth` | 914-1049 | Sign in / sign up / reset password, one component with internal mode state |
| `HomeScreen` | 1332-1444 | Workspace home: review queue, quick-add, recent table, batch-mini summary |
| `NewClassification` | 1446-1567 | New-classification form + live agent research progress + clarifying question |
| `ResultScreen` | 1572-2051 | Classification result: recommendation, actions, candidates, evidence, audit drawer |
| `UploadScreen` | 2053-2109 | Batch upload: dropzone + column mapping |
| `BatchScreen` | 2323-2419 | Batch review: throttle banner, bulk-approve, `ClassificationExplorer` |
| `LibraryScreen` | 2421-2458 | Classification library: `ClassificationExplorer` + CSV export action |
| `SettingsScreen` | 2489-2857 | Settings tabs: General, Members (invite/remove/role), Review rules |
| `StatesScreen` | 2859-2914 | Component reference page (waking/empty/loading/error/404 states) — reached via `#states` hash, the prototype's equivalent of our `/_kit` |
| `WakingScreen` | 2942-2955 | Full-page cold-start presentation (see Shortcut 4 for its trigger) |
| `ErrorScreen` | 2957-2970 | Full-page error presentation (see Shortcut 4 for its trigger) |
| `NotFoundScreen` | 2972-2983 | Full-page 404 presentation |
| Privacy / Terms | 3080-3107 | Inline JSX inside `App()` using `StaticPage` — not separate named components |
| `App` (default export) | 2985-3200 | Root: screen-state router, all mutation callbacks, toast state, renders the active screen inside `AppShell` |

## Mock-data blocks (beyond `products`)

| Block | Lines | Purpose |
|---|---|---|
| Landing accuracy stats | 726-746 | Hardcoded 92.4% / 84.1% / 3,200 / 100% stat grid (already `sample-label`-tagged) |
| Methodology `chapters` | 799-805 | Hardcoded per-chapter recall values for the bar chart (already `sample-label`-tagged) |
| Methodology evaluation `dl` | 865-882 | Hardcoded snapshot/top-1/top-3/last-updated stats (already `sample-label`-tagged) |
| `ResultScreen` initial `audit` | 1598-1610 | Three seed audit-trail entries with fixed clock times (09:16-09:18) |
| `SettingsScreen` initial `members` | 2497-2519 | Three seed team members (Alex/Mina/Jordan) |
| Home "batch-mini" summary | 1427-1441 | Static filename `November apparel import.csv` + always-100% progress text |
| Batch screen header | 2344-2353 | Static title `November apparel import` + fixed "Started today at 08:56" |

## Shortcuts the real app must fix

### 1. `window.alert` / `window.confirm`
**None found in this export.** Destructive actions already route through `Modal` (delete: 577-598; override: 1926-1979; reject: 1981-2015; ask-for-info: 2016-2048; invite member: 2774-2828; remove member: 2829-2854; bulk-approve: 2392-2416), and feedback already routes through the toast system (`notify`/`showToast`, rendered at 3175-3197). CLAUDE.md §10's "no `window.alert`/`confirm`" correction appears already satisfied by this particular export — nothing to port away from here.

### 2. Hardcoded counts / copy not derived from data
- **"14 sources" / "14 documents"** (lines 1602, 1902) — literal, not tied to any real evidence-array length. The real app must derive this from the actual `evidence` list.
- **Upload "14 rows · 48 KB"** (line 2071) — fake fixed stats shown on click, not parsed from a real CSV. Must derive from the actually uploaded file.
- **"`{items.length}` of `{items.length}` products classified"** (line 1433, and 2362 in the warning banner) — both sides are literally the same `items.length`, so this always renders 100% complete by construction. The mock `Batch` model has no real "classified so far vs. total" concept; the real app needs an actual partial-progress count (`Batch.classified` vs `Batch.total` per `docs/api-contract.md`).
- **Audit/batch timestamps** — "09:18/09:17/09:16" (1598-1610), "Researched today at 09:18" (1680), "Started today at 08:56" (2347) are fixed clock strings, not real timestamps.
- Landing/Methodology accuracy figures (726-746, 799-805, 865-882) are hardcoded but **already** correctly wrapped in `sample-label` — keep them wired to the real `GET /evaluation/summary` (`isSample` flag) once that entity exists rather than re-hardcoding.

### 3. Override vs. reject conflation
- **Red styling on Override**: the "Override code" button uses `variant="reject"` (lines 1763-1765) — the same red styling as the actual Reject button, even though override's outcome is `status: "Approved"` + `overridden: true`. Per design.md's color rule, red is reserved for rejected/error/destructive only; override should get its own visual treatment, not borrow reject's.
- **Row-menu "Override code" is a no-op shortcut**: in `ProductTable`'s `runAction` (line 460), the `"override"` action just calls `onOpen(item)` — identical to `"open"`. It doesn't actually override anything from the table row menu; the real override flow only exists once you're on `ResultScreen`. The real app must either wire a genuine inline override or remove the row-menu entry until it does something distinct from Open.
- **What's already correct**: the actual override submit handler (1930-1942) does the right thing once reached — sets `status: "Approved"`, `overridden: true`, and requires a non-empty reason. The reject modal (1981-2015) is a properly separate action that sets `status: "Rejected"` and clears `overridden` (line 1992). Port the ResultScreen-level logic; fix the row-menu shortcut and the red-styling conflation.

### 4. Waking-up timer (and the related error/cold-start hacks)
- **`go()`'s cold-start timer** (lines 3017-3029, specifically `window.setTimeout(() => setScreen("home"), 2000)` at line 3021) — a flat 2-second timer on first navigation to Home, not a real `/health` check. CLAUDE.md §10 requires this be driven by an actual health endpoint.
- **Related shortcut, same category**: the `error` screen is only reachable via a `?error` URL query-string hack (lines 2986-2987), and its retry handler (3110-3119) just flips state back to `home` rather than retrying a real request. Both the waking screen and the error screen are presentation-only here, triggered by a timer/URL hack instead of a real request lifecycle — fix both together when wiring the real `/health` check and real query/mutation error states.
- The `WakingScreen` (2942-2955) and `ErrorScreen` (2957-2970) presentational components themselves are fine to port as-is; only their *triggers* need replacing.

### 5. Navigation by state, not by URL
- **`screen` state variable** (line 2993) — the entire app is one component tree switching on a single in-memory `Screen` string; there is no distinct URL per screen.
- **`initialScreen` computation** (lines 2986-2992) — on load, picks `"error"` from a `?error` query string, `"states"` from a `#states` hash, `"notfound"` from any other hash, else `"landing"`. This is the only place a URL maps to a screen at all, and it's a one-time read, not routing.
- **`go()`** (lines 3017-3029) — the sole navigation function. It calls `setScreen(next)` (an in-memory state change, not a URL change), has the special-cased cold-start branch for `"home"` (3018-3022, see Shortcut 4), and only touches the URL to strip a stale hash (3025-3027) or scroll to top (3028) — it never pushes a new URL for the screen it's navigating to.
- **`#states` hash handling** — read once in `initialScreen` (line 2988) and again live via the `hashchange` listener (lines 3004-3011, specifically line 3006). This is the only screen with any real URL binding, and it's hash-based, not a path.
- **Catch-all not-found** — reached two ways: the `initialScreen` ternary's fallback (line 2991, `window.location.hash ? "notfound" : "landing"`) and the `hashchange` listener's fallback (line 3007, `else if (window.location.hash) setScreen("notfound")`). Rendered via `if (screen === "notfound") return <NotFoundScreen go={go} />;` (line 3108); `NotFoundScreen` itself is 2972-2983.
- **Net effect**: every screen transition (3077-3119 for the ungated screens, 3121-3168 for the `content` lookup feeding `AppShell`) is a state switch, not a route change. Browser Back/Forward does nothing for almost every screen, deep links to any screen other than `#states` 404, and a page refresh always drops back to Landing (or Not found, if a stray hash survived). This is exactly CLAUDE.md §10's "navigation uses router URLs" correction — the real app's `react-router` routes (`shared/config/routes.ts`) replace this whole mechanism; nothing here should be ported beyond the screen-to-content mapping itself.

### 6. Row and menu keyboard accessibility
Checked `ProductTable`'s rows and `PortalMenu` against focus, Enter/Space, Esc, arrow keys, and focus return.

- **Table rows are not keyboard-operable at all.** The `<tr>` (lines 509-516) has `onClick={() => onOpen(item)}` but no `tabIndex`, no `role="button"`/`"row"` with a key handler, and no `onKeyDown`. A native `<tr>` is never in the tab order, so a keyboard user cannot focus a row or activate it with Enter/Space — `onOpen` is only reachable by mouse. Design.md's DataTable spec and CLAUDE.md §7 ("full keyboard operation (tables rows, menus, modals)") both require this; it is missing entirely.
- **The row-action trigger button is keyboard-reachable but under-announced.** The per-row "Actions" button (`ProductTable`, lines 537-552) is a real `<button>`, so it is focusable and Enter/Space-operable by default — that part works. But it has no `aria-expanded` or `aria-haspopup`, so assistive tech has no way to know it opens a menu or whether that menu is currently open. Contrast with the topbar's `workspace-switcher`/`help-button`/`avatar-button` (lines 1201-1212, 1244-1250, 1283-1290), which correctly set `aria-expanded={activeMenu === "..."}`.
- **`PortalMenu` has no menu semantics.** The portalled container (line 421, `<div ref={ref} className="row-menu row-menu--portal" ...>`) has no `role="menu"`, and every item inside it is a plain `<button>` with no `role="menuitem"` (`ProductTable`'s items: lines 555-569; the member-row menu's items: lines 2655-2682). Contrast again with the topbar popovers, which do use `role="menu"` on the container (e.g. line 1214) and `role="menuitem"` on each button (e.g. line 1223).
- **Esc-to-close is implemented.** `PortalMenu`'s effect (lines 408-419) attaches a `keydown` listener that checks `event.key === "Escape"` (line 412) and closes the menu; this part already meets CLAUDE.md §7's "Esc closes overlays."
- **Arrow-key navigation between items is missing.** Nothing in `PortalMenu` (392-426) or either call site (`ProductTable`: 553-571; `SettingsScreen`'s member menu: 2650-2684) listens for `ArrowUp`/`ArrowDown` to move among menu items — a keyboard user who tabs into the menu can only Tab/Shift+Tab item by item.
- **Focus never moves into the menu on open, and never returns to the trigger on close.** Opening a menu (e.g. `setOpenMenu(...)` at line 541, or `setMemberMenu(...)` at line 2637) doesn't focus the first menu item, and every `onClose` (line 554's `() => setOpenMenu(null)`; line 2653's `() => setMemberMenu(null)`) just clears the state — no `.focus()` call returns focus to the icon-button that opened it. After closing via Escape or outside click, focus is lost to the document body instead of landing back on the trigger.
