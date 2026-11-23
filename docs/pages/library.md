# Page brief: Library

Status: approved
Route: `/app/library` | FSD slice: `pages/library`, plus `widgets/classification-table` (new), `features/delete-classification` (new), `features/review-decision` (from the classification-detail brief), reuses `entities/classification`

Decisions recorded on approval:

- LB-1: extract the table widget **first** and move Home onto it, in a separate commit; `features/delete-classification` is extracted the same way (see Preparatory steps).
- LB-2, LB-3, LB-5, LB-6: defaults as written. Where a line below still says "DEFAULT", that default is the approved behavior.
- LB-4: **CSV export is cut.** No Export button, no `GET /export/classifications` handler, no `shared/api/http.ts` change, no export toast.

Contract note: the decision endpoint `POST /classifications/:id/decision` accepts exactly these actions: `approve`, `reject`, `override`, `request_info`, `undo`. Deletion is only `DELETE /classifications/:id`; it is never a decision action. This page's row menu uses `approve` (decision endpoint) and delete (`DELETE`).

## Preparatory steps (separate commits, in this order, before any Library work)

1. **`features/delete-classification`**: move Home's delete-with-Undo logic (the page-local `useDeleteClassification` mutation in `pages/home/api` and the deferred-`DELETE`-until-the-Undo-window-closes behavior, with its tests) into the new feature; Home imports it from `@/features/delete-classification`. Behavior unchanged. One commit.
2. **`widgets/classification-table`**: extract Home's table (columns, row menu, delete confirm `Modal`, approve wiring) into the widget, and move Home onto it. Behavior unchanged, Home tests pass. One commit, separate from step 1.
3. This depends on `features/review-decision` existing (created by the classification-detail task's first commit). If Library is built before that, do the approve move first, as described in that brief, or stop and ask.
4. If Home's page-local table or mutations do not exist yet when this task starts, stop and ask rather than building them from scratch here.

Each preparatory commit passes `npm run check` on its own.

## Design reference

- Figma URL / node: https://www.figma.com/make/v8wpvjs0lOovob7BIzYKzu/HS-Copilot-Classification-Workspace (fileKey `v8wpvjs0lOovob7BIzYKzu`, node `0:1`) - Make file, source only.
- Screenshots: `design/screens/library.png`, `design/screens/library.mobile.png`. No tablet screenshot.
- Make source (via `docs/make-export-index.md`): `LibraryScreen` (2421-2458), `ClassificationExplorer` (2163-2321), `FilterDropdown` (2111-2161), `ProductTable` (428-601, row menu and delete flow, same one the Home brief ported).
- Visuals come only from `design.md` (the export's navy, pill status chips and boxed table card are stale).

## Purpose and user goal

Find any past classification: search by product or HS code, narrow by status, page through the results, open one, and take a quick action from the row.

## Layout and sections (top to bottom)

1. `PageHeader`: no eyebrow, H1 "Classification library", description "Search every reviewed decision." (the export's "and export the current view" is dropped because export is cut). No action.
2. **Controls row**: `SearchField` (placeholder "Search products or HS codes") and the status filter (DEFAULT: a native checkbox group, see Filters).
3. **Table in a `Card`** via `DataTable` (default density, rows 56px): columns Product, Suggested code, Confidence, Status, Updated, row-actions. No checkbox column this task (`LB-2`).
4. **Pagination row**: left "Showing 1–10 of 14" (12/16, `--muted`), right Previous and Next buttons.

Rows come from `widgets/classification-table`, a new widget composing `DataTable`, the row `Menu`, the delete-confirm `Modal` and the approve / delete mutations, so Home, Library and later Batch review share one table (`LB-1`).

## Exact copy

- "Classification library", "Search every reviewed decision." (deviation from the export copy, because there is no export).
- Search: placeholder "Search products or HS codes", accessible name "Search classifications" (the export has no visible label or aria-label).
- Status filter group legend: "Status"; options "Approved", "Needs review", "Rejected", "Pending" (as in the export).
- Column headers: "Product", "Suggested code", "Confidence", "Status", "Updated", and a visually hidden "Actions".
- Status cell: `StatusIndicator` label; overridden rows also show the "Overridden" indicator.
- Updated cell: "Today", "Yesterday", otherwise a short date from `Intl` (e.g. "Nov 12").
- Row menu: "Open", "Approve", "Copy code", "Delete" (same four as Home; no "Override code", "Reject" or "Re-run research", see corrections).
- Pagination: "Showing `{from}`–`{to}` of `{total}`", "Previous", "Next".
- Toasts: "Classification approved", "HS code copied", "Classification deleted" (with Undo).
- Delete confirm modal: title "Delete classification?", body `This removes "{product}" from the workspace.`, "Cancel" / "Delete".
- Empty, filters active: EmptyState "No classifications match these filters." with action "Clear filters" (new copy for the action).
- Empty, nothing exists yet: EmptyState "No classifications yet" with action "New classification" (same copy as the Home brief).
- Error: ErrorState "We couldn't load the library" with "Try again" (new copy).

## Components

| Element        | Component                                            | Existing / New (+ proposed props)                                                                                                                                                                                                                                                          |
| -------------- | ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Header         | `PageHeader`, `Button`                               | Existing                                                                                                                                                                                                                                                                                   |
| Search         | `SearchField`                                        | Existing. Controlled; debounced write to the URL.                                                                                                                                                                                                                                          |
| Status filter  | `Checkbox` inside a native `<fieldset>` / `<legend>` | Existing components only. **No `FilterDropdown`** (see below).                                                                                                                                                                                                                             |
| Table          | `DataTable`                                          | New in the Home brief; reused here. Needs no new props beyond what Home defines; the optional Updated column is a column definition, not a DataTable API change.                                                                                                                           |
| Row cells      | `CodeText`, `Meter`, `ClassificationStatusBadge`     | Existing / entity-local (Home brief)                                                                                                                                                                                                                                                       |
| Row menu       | `Menu`                                               | Existing (built). Opens from an `IconButton` trigger.                                                                                                                                                                                                                                      |
| Delete confirm | `Modal`                                              | New in the Home brief                                                                                                                                                                                                                                                                      |
| Toasts         | `Toast`                                              | New in the Home brief                                                                                                                                                                                                                                                                      |
| Pagination     | `Pagination`                                         | **New** shared/ui (planned in inventory). Props: `page` (1-based), `pageSize`, `total`, `onPageChange(page)`, optional `label` for the nav `aria-label`. Renders the range text plus secondary `Button`s "Previous" / "Next", disabled at the ends. Pure presentational, no URL knowledge. |
| Loading        | `Skeleton` (table-shaped rows)                       | Existing                                                                                                                                                                                                                                                                                   |
| Empty          | `EmptyState`                                         | Existing                                                                                                                                                                                                                                                                                   |
| Load error     | `ErrorState`                                         | **New** (planned in inventory), shared with the other two briefs                                                                                                                                                                                                                           |
| Table widget   | `ClassificationTable`                                | **New widget**, `widgets/classification-table`. See below.                                                                                                                                                                                                                                 |

### Which of Tabs, Pagination, FilterDropdown does Library need?

- **Tabs: no.** Tabs are for Settings navigation only.
- **Pagination: yes**, as the tiny shared component described above: Previous/Next buttons and a range line, nothing else (no page numbers, no jump-to). It matches the export exactly and Batch review will reuse it.
- **FilterDropdown: no, DEFAULT.** The only filter this task needs is status, which has four values, and Home links here with two selected (`?status=needs_review,pending`). A `<fieldset>` of four existing `Checkbox`es is native, keyboard and mobile friendly, needs no popover, no Radix and no new component, and can show any combination. Deviation: the export uses a dropdown button "Status: All". If you prefer the export's dropdown, the simplest version would be a new `FilterDropdown` (a disclosure with the same checkboxes, Esc and outside-click close); question `LB-3`.
- **Confidence filter: deferred** (`LB-2`); the contract already supports `confidenceBand[]`, so adding it later is a one-line addition to the same fieldset or a native `<select>`.

### Widget: `widgets/classification-table`

Props: `{ items, isFetching?, showUpdated?, emptyState }`. Internally uses `DataTable`, the row `Menu`, the delete `Modal`/Undo flow and `features/review-decision` (approve). Home builds its own table page-locally (Home brief); Library is the second consumer, so the widget is extracted first and Home is moved onto it, each as a separate preparatory commit (see Preparatory steps; LB-1 decided).

Approve comes from `features/review-decision` (shared with detail). Delete-with-grace-window lives in the new `features/delete-classification`, extracted from Home the same way, so the widget imports features rather than page code. `docs/architecture.md`'s slice map gets `delete-classification` added to the features list in the first preparatory commit (docs only), since it is a new slice not previously listed.

## Data

### Query

- Reuses `useClassifications(params)` from `entities/classification` (Home brief): `GET /classifications?search=&status=a,b&page=&pageSize=&sort=`, parsed into `{ items, total, page, pageSize }`. The key factory already takes `params`, so each page/filter combination is its own cache entry.
- Library params: `search`, `status[]` (comma-separated per the contract), `page`, `pageSize = 10` (DEFAULT, the export's demo value of 3 is a prototype artifact), `sort` same as Home (`updatedAt` descending).
- `placeholderData: keepPreviousData` so paging and typing keep the old rows visible (dimmed, `aria-busy`) instead of flashing skeletons.
- No new schema.

### URL state (single source of truth; makes Home's "Review all" link and the Back button work)

- `?q=<text>&status=<csv>&page=<n>`. Missing = defaults ("", all statuses, page 1).
- Search input is local state with a 300 ms debounce writing `q` to the URL (replace, not push); status and page changes push history entries. Any filter or search change resets `page` to 1.
- Unknown `status` values in the URL are ignored (filtered through the entity's status union). Out-of-range `page` is clamped to the last page once `total` is known.

### Mutations in this page

- Approve (`features/review-decision`, `approve` action on the decision endpoint), delete with Undo (`features/delete-classification`, `DELETE /classifications/:id` only), copy code (no network). Each invalidates `classificationKeys.lists()`.
- No export: `GET /export/classifications` is not called and `shared/api/http.ts` is not touched (LB-4 decided).

### MSW

- Extend `GET /classifications` (Home brief) so `search` matches description and codes case-insensitively and `status` filters by the comma-separated set; `page`/`pageSize` slice the result and `total` is the filtered count.
- No export handler is added.
- Fixtures: the 14 records. Their `updatedAt` values are computed relative to now so "Today" and "Yesterday" are true; at least one record dated more than two days ago to exercise the short-date format. No new records required (14 items = 2 pages at 10).
- Latency 300-700 ms; `forceError`, `forceDelay`.

## States

- **Loading** (first load): skeleton table rows matching header and 6 columns; controls render immediately.
- **Fetching** (paging/filtering with previous data): old rows stay, `aria-busy="true"` on the table card, no layout jump.
- **Empty, filtered**: EmptyState inside the table card area with "Clear filters" (clears `q`, `status`, `page`).
- **Empty, no data at all** (no filters and `total === 0`): "No classifications yet" with a "New classification" button linking to `routes.classifyNew`.
- **Error**: ErrorState with "Try again" (`refetch()`); the controls stay usable.
- **Partial**: results exist but the user is on an out-of-range page: clamp to the last page.
- **Permission**: none this task.
- **Overridden / needs-review rows**: overridden rows show Approved plus Overridden indicators; rows are never tinted by status (status shows only through the dot-plus-label indicator in its own column).

## Interactions

- Typing in search updates results after a 300 ms debounce; Enter does not submit anything extra; the field is `type="search"`.
- Toggling a status checkbox updates the URL and the list; the group announces nothing extra (results count is in the pagination line, wrapped in `aria-live="polite"`).
- Home's "Review all" link `/app/library?status=needs_review,pending` loads with those two boxes checked.
- Previous/Next change `page` (push); focus stays on the button; when a button becomes disabled at the end of the range, focus moves to the other one so keyboard users are not dropped.
- Row: the product name is a real `Link` to `routes.classificationDetail(id)` (the row's accessible navigation target; clicking elsewhere in the row, outside the menu cell, follows the same href for mouse users), as in the Home brief.
- Row menu (`aria-haspopup`, `aria-expanded`, arrow keys, Esc, focus returns to the trigger, portal, flips near edges; all provided by `Menu`): "Open" navigates; "Approve" runs the mutation, toast, and is hidden for already approved rows (`LB-6`); "Copy code" writes the suggested code with the clipboard API plus toast; "Delete" opens the confirm modal then the optimistic-with-Undo flow exactly as specified in the Home brief (the real `DELETE` fires only after the toast window elapses and is cancelled by Undo).
- Document title: "Library" via `useDocumentTitle`.

## Responsive behavior

- `<=1000px`: no layout change (full-width content already).
- `<=720px`: page-header action stacks below the description (existing `PageHeader` behavior); controls wrap, with the search field full width and the status group below it (checkboxes wrap); the table scrolls horizontally inside its card (design.md §8); pagination row keeps range text left and buttons right and wraps if needed. Touch targets 40px.

## Prototype corrections that apply here

- **Pagination copy and totals** (2273-2274): "Showing a–b of N" now derives from the response `total`, `page` and `pageSize`, never `filtered.length` of a client array. Client-side filtering and paging of the full list (2197-2205) is replaced by server-side params.
- **Row-menu "Override code" that only calls `onOpen`** (460): removed from the menu; Override lives on the detail page (see that brief).
- **Row-menu "Reject" with no reason** (470): removed; reject requires a reason and belongs to the detail page. Same reasoning for dropping "Re-run research" (no contract endpoint, toast-only fake), as in the Home brief.
- **Bulk bar's one-click bulk Reject** (2300): deferred together with selection, because bulk reject without a reason would contradict the reason-required rule. Bulk actions belong to Batch review (`features/bulk-review`).
- **Hard-coded counts and fake dates**: "Updated" is computed from `updatedAt` with `Intl` ("Today", "Yesterday"), not stored strings from the export's seed data; counts come from `total`.
- **Filter state not in the URL**: filter, search and page live in the URL so Back, reload, deep links and Home's link work (Shortcut 5).
- **Keyboard**: table rows are not focusable in the export (Shortcut 6); here the product-name `Link` is the tab stop and the menu follows the Menu component's semantics.
- **Global-search `data-global-search` attribute and global `/` shortcut**: not ported (dropped in the Home brief).
- **Export CSV that only shows a toast** (2443): cut (LB-4). A button that looks like it exported but does not is worse than no button; it returns when the backend endpoint and a non-JSON `http.ts` path are approved. The page description loses its "and export the current view" clause accordingly.
- **No `window.alert/confirm`**: none in the export; delete uses `Modal` and Undo toast.

## Open questions for me

None. LB-1 to LB-6 are resolved above.

## Acceptance criteria (testable)

- [ ] `/app/library` loads page 1 (10 rows of 14 from the mock) with a table-shaped skeleton while loading.
- [ ] Typing in the search field filters by product text and by HS code after a debounce and writes `q` to the URL; clearing it restores the full list.
- [ ] Status checkboxes filter results; `?status=needs_review,pending` pre-checks both boxes; unknown status values are ignored.
- [ ] Changing search or status resets to page 1; Previous/Next update `page` in the URL; Previous is disabled on page 1, Next on the last page; out-of-range pages are clamped.
- [ ] "Showing a–b of N" derives from `total`, `page`, `pageSize`; it shows no stale number while filtered results load.
- [ ] Browser Back/Forward restores previous search, status and page; reload keeps them.
- [ ] Rows: product name is a real link to the detail page; overridden rows show both Approved and Overridden indicators; Updated shows Today / Yesterday / short date computed from `updatedAt`.
- [ ] Row menu has exactly Open, Approve (hidden for approved rows), Copy code, Delete; trigger exposes `aria-haspopup` and `aria-expanded`; arrow keys work; Esc closes and returns focus.
- [ ] Approve updates the row and shows a toast; Copy code copies the suggested code; Delete shows the confirm modal, removes the row optimistically, and the real request fires only after the toast window and never if Undo is clicked.
- [ ] There is no Export button, no export handler or toast, and `shared/api/http.ts` is unchanged.
- [ ] Preparatory commits exist separately and in order: `features/delete-classification` extraction, then `widgets/classification-table` extraction with Home moved onto it; Home's behavior and tests are unchanged and no Library code is in them.
- [ ] Approve calls only the decision endpoint's `approve` action; delete calls only `DELETE /classifications/:id`.
- [ ] Empty (filtered), empty (no data), error with working "Try again", and fetching (previous data kept, `aria-busy`) states are implemented.
- [ ] No `FilterDropdown`, `Tabs`, checkbox selection column, or bulk bar added; `Pagination` added with test, `/_kit` entry and inventory entry; `ErrorState` added or reused.
- [ ] Responsive at 375 / 768 / 1280; table scrolls inside its card at `<=720px`; no raw colors or off-scale spacing.
- [ ] Tests: URL-state parsing and serialisation, debounce, pagination boundaries, each state, row menu actions, delete+Undo timing, `Pagination` unit tests.
- [ ] `npm run check` passes.

## Expiring filter and banner (plans, limits and expiry, step 4)

- **URL**: `?expiring=true` is stored in the URL like `q`, `status` and `page` (only the exact value "true" turns it on). When on, the list request sends `expiring=true` and combines with search and status.
- **Chip**: "Expiring soon" in the controls row, with a remove button named "Remove filter: Expiring soon". Removing it deletes `expiring` and resets to page 1. "Clear filters" also removes `expiring`. The chip is page-local (white, 1px `--line-strong` border, `--radius`), since there is no shared chip component.
- **Banner**: the same `widgets/expiring-banner` as Home, shown only while the filter is off; with the filter on, the chip replaces it.
- **Empty state**: when `expiring` is the only filter and nothing matches: "No records are expiring soon." with a "Clear filter" button. With other filters also on, the existing "No classifications match these filters." state is used.
- Pagination is unchanged; changing the filter resets to page 1.
