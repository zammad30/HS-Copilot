# Page brief: Batch upload + Batch review

Status: approved
Route: `/app/batches/new` (upload), `/app/batches/:id` (review) | FSD slice: `pages/batch-upload` (new), `pages/batch-review` (new), plus `entities/batch` (new, shared by both), `shared/lib/parseCsv` (new), reuses `widgets/classification-table`, `entities/review-rule` (promoted from `pages/settings` in this task - see BR-6)

## Design reference

- Figma URL / node: https://www.figma.com/make/v8wpvjs0lOovob7BIzYKzu/HS-Copilot-Classification-Workspace (fileKey `v8wpvjs0lOovob7BIzYKzu`, node `0:1`) - Make file, source only.
- Screenshots: `design/screens/batch-upload.png`/`.mobile.png`, `batch-review.png`/`.mobile.png`. No tablet screenshots.
- Make source (via `docs/make-export-index.md`): `UploadScreen` (2053-2109), `BatchScreen` (2323-2419), `ClassificationExplorer` (2163-2321, reused by Batch review the same way Library's brief already decided to reuse it via `widgets/classification-table`), `FilterDropdown` (2111-2161, confirmed not used - see Library's precedent), `products` seed data (108-235, source for batch-item fixtures).
- Visuals come only from `design.md` (the export's `dropzone`/`mapping-card`/`warning-banner` classes are stale; colors/radius/shadow/typography come only from `design.md`).

## Purpose and user goal

Batch upload: import a CSV of products, map its columns, and start classifying all of them in one run. Batch review: watch a running batch's progress, review/approve its results using the same table as Home and Library, and bulk-approve the ones the agent is already confident about.

## Layout and sections

### Batch upload (`/app/batches/new`)

1. `PageHeader`: eyebrow "Batch upload", title "Import product data", description "Upload a CSV and map your columns before classification begins." No action.
2. Two-column grid (DEFAULT: same 7/5-style split as Home's review-queue/quick-add grid, collapsing to one column at `$bp-tablet` - the export's `upload-grid` has no documented ratio, so this follows the established pattern rather than inventing a new one; BU-1 open question if a different split is intended):
   - **Upload card**: a real dropzone (`<label>`/`<button>` wrapping a visually-hidden `<input type="file" accept=".csv">`), drag-and-drop plus a visible "Choose file" `Button`, both reachable by keyboard (the file input itself is the focusable, operable control - Enter/Space on a focused label-button opens the OS file picker, same as a native file input always does). Below it, a secondary "Download template" link-button (icon `Download`) that downloads a static sample CSV (see Data).
   - **Mapping card**: eyebrow "Step 2", H2 "Map columns", caption `"{mapped} of {required} required"` (derived from how many required fields currently have a column selected, not a hardcoded "3 of 3"). One row per required field - "Product description", "SKU / reference" (required), "Material" (optional, no asterisk) - each a native `Select` populated with the file's actual detected headers, auto-matched when a header's name is an obvious match (case-insensitive exact or substring match against each field's known aliases, e.g. "description"/"product" for Product description). `Select` "Destination" (required, six options from `DESTINATIONS`: United States, European Union, United Kingdom, Canada, Australia, Turkey; no empty option; starts on the workspace default destination via `useWorkspace`, falling back to United States while the workspace loads or if it fails; the choice applies to this batch only and never changes the workspace default; sent as `jurisdiction`). `Button` "Start batch classification", disabled until a file is uploaded and every required field is mapped.
3. Parse errors (bad file type, over size/row limits, unparseable CSV) render inline under the dropzone, not as a toast (the user needs to fix the file before anything else is possible). **BU-2 resolved**: once the description column is mapped, each row's description must be non-empty and at most 1000 characters; empty rows are skipped and counted ("N empty rows skipped"), and a row exceeding 1000 characters produces a clear inline error naming the row number ("Row 42 is too long (max 1000 characters)."), rather than blocking on the whole file.

### Batch review (`/app/batches/:id`)

1. `PageHeader`: eyebrow "Batch review", title = the batch's `filename` (without extension, DEFAULT - BR-1 open question if the full filename with extension is preferred), description `"{total} products · {jurisdiction label} · Started {relative time}"` (e.g. "Started 2 hours ago" / "Started today at 9:14 AM" - using the existing `formatDate`-style helper, not a hardcoded string), action `Button` "Upload batch" (secondary, icon `Upload`) → `routes.batchUpload`.
2. **Progress banner** (replaces the export's fake throttle banner - see Prototype corrections): shows while `status !== "complete"`. `Banner` (amber) with an icon, `"{classified} of {total} classified"` and the batch's real `status` label ("Processing" / "Throttled" / "Paused"), a "Pause"/"Resume" text-button (calls `POST /batches/:id/pause` or `/resume`). **BR-2 resolved**: the banner is not dismissible while processing (`status !== "complete"`); once `status === "complete"` it becomes dismissible, since at that point it is a one-time notice rather than live status.
3. **Bulk-approve action**: `Button` (approve variant, icon `Check`) `"Approve {count} above {threshold}%"`, where `threshold` comes from `entities/review-rule`'s `highlightAbove` (default 90 if the query hasn't resolved yet, per the task's decided fallback) and `count` is derived from the batch's own classifications, not the export's always-fresh-array filter. Disabled when `count === 0`.
4. The table: `widgets/classification-table` (same widget Home and Library use), fed this batch's classifications, compact density (matching the export's `compact` prop on `ClassificationExplorer`/`ProductTable`), with search + status filter controls exactly as Library's brief already specified (`SearchField` + a `<fieldset>` of status `Checkbox`es, no `FilterDropdown`, no confidence filter this task - same `LB-2`/`LB-3` reasoning Library already settled, reused here rather than re-decided). Pagination via the shared `Pagination` component.
5. Confirm `Modal` for bulk-approve: title `"Approve {count} classifications?"`, description `"This approves {count} classifications with confidence of {threshold}% or higher. Each decision is logged."`, Cancel / `"Approve {count}"`.

## Exact copy

- Upload: "Batch upload", "Import product data", "Upload a CSV and map your columns before classification begins.", dropzone idle text "Drop a CSV here, or choose a file", dropzone helper "CSV up to 5 MB · Up to 500 rows per file" (CLAUDE.md-decided limits, not the export's "10 MB"), "Download template".
- Mapping: "Step 2", "Map columns", `"{mapped} of {required} required"`, field labels "Product description", "SKU / reference", "Material", "Destination", "Start batch classification".
- Parse error copy (examples, exact wording TBD at implementation - BU-2): "This file is larger than 5 MB.", "This file has more than 500 rows.", "Choose a CSV file.", "We couldn't read this file. Check it's a valid CSV and try again.", "N empty rows skipped.", "Row 42 is too long (max 1000 characters)."
- Review: eyebrow "Batch review", description `"{total} products · {jurisdiction} · Started {time}"`, "Upload batch".
- Progress banner: `"{classified} of {total} classified"`, "Processing" / "Throttled" / "Paused", "Pause" / "Resume".
- Bulk action: `"Approve {count} above {threshold}%"`; modal title `"Approve {count} classifications?"`, body `"This approves {count} classifications with confidence of {threshold}% or higher. Each decision is logged."`, "Cancel", `"Approve {count}"`.
- Search placeholder "Search products or HS codes" (reused verbatim from Library).
- Toasts: `"{count} classifications approved"`, plus the table's existing per-row toasts ("Classification approved", "HS code copied", "Classification deleted").
- Empty (no rows match filters): "No classifications match these filters." with "Clear filters" (same copy as Library).
- Load error: ErrorState "We couldn't load this batch" with "Try again".
- Unknown batch id: not-found state, "We couldn't find this batch." with a link back to `routes.batchUpload` (BR-3 open question - see below).

## Components

| Element                 | Component                                                                           | Existing / New (+ proposed props)                                                                                                                    |
| ----------------------- | ----------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Headers                 | `PageHeader`                                                                        | Existing                                                                                                                                             |
| Cards                   | `Card`                                                                              | Existing                                                                                                                                             |
| Dropzone                | native `<label>` + visually-hidden `<input type="file">` + `Button` ("Choose file") | Existing components only; no new shared/ui - a dropzone is markup + the `shared/lib` parser, not a visual primitive `design.md` specifies separately |
| Column mapping rows     | `Select` (per field)                                                                | Existing                                                                                                                                             |
| Progress banner         | `Banner`                                                                            | Existing                                                                                                                                             |
| Bulk-approve button     | `Button` (approve variant)                                                          | Existing                                                                                                                                             |
| Confirm modal           | `Modal`                                                                             | Existing                                                                                                                                             |
| Table                   | `widgets/classification-table`                                                      | Existing (built in the Library task)                                                                                                                 |
| Search + status filters | `SearchField`, `Checkbox` in a `<fieldset>`                                         | Existing (same pattern as Library)                                                                                                                   |
| Pagination              | `Pagination`                                                                        | Existing                                                                                                                                             |
| Toasts                  | `Toast`                                                                             | Existing                                                                                                                                             |
| Loading                 | `Skeleton`                                                                          | Existing                                                                                                                                             |
| Empty / error           | `EmptyState`, `ErrorState`                                                          | Existing                                                                                                                                             |

### Which of Tabs, FilterDropdown, a new Dropzone component does Batch need?

- **Tabs: no.**
- **FilterDropdown: no** - same reasoning as Library (`LB-3`): a four-value status `<fieldset>` of existing `Checkbox`es covers it.
- **A dedicated `shared/ui` Dropzone: no, DEFAULT (BU-3 open question).** The upload card is one-page markup (a styled `<label>` around a native file input plus a `Button`) backed by `shared/lib/parseCsv`; `design.md` has no dropzone spec to build a reusable primitive against, and there is only one consumer. If a second upload surface appears later, promote it then.
- **No new shared/ui component this task.**

## Data

### `entities/batch` (new, shared by both pages)

- `model/batch.schema.ts`: zod schema matching `docs/api-contract.md`'s `Batch` interface exactly (`id`, `filename`, `total`, `classified`, `status: "processing"|"throttled"|"paused"|"complete"`, `jurisdiction`, `startedAt`). `BatchItem`/classification-list-for-a-batch reuses `entities/classification`'s existing `classificationSchema` - a batch's rows are `Classification` records, not a separate shape.
- The mock batch store shares the same in-memory record array the classification mock handlers already read and write - a batch's rows are real entries in that one store, tagged internally with the batch they belong to, not a parallel/duplicate store. Each poll of `GET /batches/:id`, the mock (not a client timer) advances `classified` toward `total` by one increment, flipping `status` through `processing` -> (optionally `throttled`) -> `complete`.
- `api/batch.keys.ts`: `batchKeys.detail(id)`, `batchKeys.items(id, params)`.
- `api/batch.query.ts`: `useBatch(id)` → `GET /batches/:id`; `useBatchItems(id, params)` → `GET /batches/:id/items` (same `search`/`status[]`/`page`/`pageSize` params as `useClassifications`, per the contract note that batch items use "same filters as classifications").
- `api/batch.query.test.tsx`.

### Mutations

- **Batch upload (page-local, `pages/batch-upload/api`)**: `useCreateBatch()` → multipart `POST /batches` with `{ file, mapping, jurisdiction }`; on success navigates to `routes.batchReview(batchId)`.
- **Batch review (page-local, `pages/batch-review/api`, until a second consumer exists per `docs/architecture.md` rule 7)**: `usePauseBatch()`/`useResumeBatch()` → `POST /batches/:id/pause`/`/resume`; `useBulkApprove()` → `POST /batches/:id/bulk-approve` with `{ minConfidence: threshold }`. Each invalidates `batchKeys.detail(id)` and the relevant `classificationKeys`/`batchKeys.items` lists. Row-level approve/delete reuse `features/review-decision` and `features/delete-classification` through `widgets/classification-table`, exactly as Library does - no new mutation for those.

### Polling (batch review)

- **BR-4 resolved**: `useBatch(id)` polls via `refetchInterval` set to 2000ms while `status !== "complete"`, matching the cadence already used for agent-run polling in the classify-new/detail flow, and stops (`refetchInterval: false`) once `status === "complete"`, mirroring the agent-run polling pattern CLAUDE.md §6/the contract already describes ("The mock advances the batch one step per poll... real polling that stops when it is done"). `useBatch` takes an optional `pollIntervalMs` override (default 2000) so tests can use a fast interval instead of waiting out real 2-second polls.
- Each poll the **mock** (not a client timer) advances `classified` toward `total` by one batch-sized increment and flips `status` through `processing` → (optionally `throttled`) → `complete`, deterministically seeded per batch id so repeated polls in tests are reproducible.

### MSW

- `src/app/mocks/handlers/batches.handlers.ts`: `POST /batches` (parses the multipart body, creates an in-memory `Batch` + generates `N` `Classification` records matching the uploaded row count, each starting `pending` with no `candidates`/`evidence` yet - DEFAULT, since the agent hasn't "run" on them), `GET /batches/:id`, `GET /batches/:id/items` (filtered/paginated the same way `GET /classifications` is), `POST /batches/:id/pause`, `/resume`, `POST /batches/:id/bulk-approve` (applies the `approve` decision transition to every item at or above `minConfidence`, server-side, appending one `AuditEntry` each - not a client-side `.forEach` as in the export).
- The advance-one-step-per-poll logic lives beside the batch store (same shape as the existing agent-run advance-per-poll mock), not duplicated per handler.
- Fixtures: one seed in-flight batch (`status: "processing"`, partial `classified`/`total`) for a direct `/app/batches/:id` deep link during development/tests, built from a slice of the existing 14-record classification fixtures (re-flagged for this batch's `workspaceId`/batch id) rather than new hardcoded records, per CLAUDE.md §6's "internally consistent" rule.
- Latency 300-700 ms; `forceError`/`forceDelay` on every new handler.

### `shared/lib/parseCsv` (new)

- A small, dependency-free CSV parser (CLAUDE.md: "no new dependency"): handles quoted fields, commas inside quotes, and CRLF line endings. **BU-4 resolved**: `parseCsv(text: string): { ok: true; headers: string[]; rows: string[][] } | { ok: false; reason: "too_many_rows" | "malformed" }` - a result object (not a thrown error) with typed reason codes, so the page renders inline errors without a try/catch and maps each code to the exact user-facing copy. The 500-row cap is enforced inside `parseCsv` (it has no concept of the original file's byte size, so the 5 MB check stays in the caller); the non-empty/at-most-1000-character rule per row (BU-2) is enforced by the upload page once the description column is mapped, not inside `parseCsv` itself, since `parseCsv` has no notion of which column is "the description".
- `shared/lib/parseCsv.ts` + `parseCsv.test.ts` covering: plain rows, quoted fields containing commas, quoted fields containing escaped quotes (`""`), CRLF vs LF line endings, a trailing blank line, and the 500-row / 5 MB limits (tested as pure functions over a string, not real File objects).
- Column auto-match (field aliases → header names) is a second pure helper in the same file or a sibling (`matchColumns(headers, fieldAliases)`), also unit-tested.

## States

- **Upload - no file yet**: dropzone shows idle copy; mapping card's selects are present but have no real headers to choose from (DEFAULT: disabled with a hint "Upload a file to map its columns" until a file is parsed - BU-5 open question on exact placeholder behavior).
- **Upload - parsed, mapping incomplete**: Start button disabled; the `"{mapped} of {required}"` caption updates live.
- **Upload - parse error**: inline error under the dropzone (file type/size/row-count/malformed-CSV), Start button disabled, no mapping card shown (DEFAULT) or shown-but-disabled (alternative) - BU-5 covers this too.
- **Upload - submitting**: Start button shows its existing `Button` loading state; disabled to prevent double-submit.
- **Review - loading** (`useBatch` first load): `Skeleton` matching header + banner + table shape.
- **Review - fetching (poll in flight)**: table/banner don't flash to skeleton on every poll; only the first load does (same `isPending` vs. background-refetch distinction used elsewhere).
- **Review - empty filtered**: `EmptyState` "No classifications match these filters." + "Clear filters" (same as Library).
- **Review - complete**: progress banner disappears once `status === "complete"`; bulk-approve button remains available as long as `count > 0`.
- **Review - error** (batch query failed, or unknown id): `ErrorState` "We couldn't load this batch" with "Try again"; a genuinely unknown id (404 `not_found`) shows the dedicated not-found copy with a link to upload a new batch instead of a generic retry (BR-3).
- **Permission**: none this task (no role-gating on batch pages; review rules' own permission gating, if any, is Settings' concern per `docs/pages/settings.md`).

## Interactions

- Dropzone: click or Enter/Space on the file-input label opens the OS picker; drag-and-drop onto the card also works (`onDrop`/`onDragOver` on the card, delegating to the same file-handling function as the input's `onChange`); dropping/selecting a non-CSV or over-limit file shows the inline error and does not populate the mapping card.
- Column `Select`s: changing one re-renders the `"{mapped} of {required}"` caption; auto-match runs once on parse, the user can override any mapping afterward.
- Start batch classification: `useCreateBatch()`; on success, navigate to `routes.batchReview(newBatchId)`; on failure, inline/toast error, form stays filled in for retry.
- Pause/Resume: calls the respective mutation; the banner's label and button text flip optimistically-but-reconciled on the next poll.
- Bulk-approve: opens the confirm `Modal` with the live-derived count and threshold; confirming calls `useBulkApprove()`, closes the modal, toasts `"{count} classifications approved"`, and the table/banner reflect the new statuses on the next poll or an immediate invalidation (whichever lands first).
- Table interactions (search, status filters, pagination, row menu, row navigation, delete+Undo): identical to Library's already-specified behavior, since this is the same widget - not re-described here beyond what differs (compact density, no "Updated" column parity question - BR-5 open question: whether Batch review's table should include an "Updated" column like Library's, or omit it like Home's compact table; DEFAULT: omit it, matching the export's `compact` table and keeping the row focused on live status during an active run).
- Document titles: "Upload batch" / `"Batch · {filename}"` via `useDocumentTitle`.

## Responsive behavior

- Upload: `<=1000px` the two-column grid collapses to one column (dropzone above mapping), matching Home's established collapse pattern.
- `<=720px`: dropzone and its buttons keep 40px+ touch targets; mapping rows stack label/arrow/select vertically if the row is too narrow.
- Review: `<=1000px` no layout change (full-width content, like Library). `<=720px`: page-header action stacks below the description; progress banner wraps its Pause/Resume and dismiss controls; bulk-approve button goes full width; table scrolls horizontally inside its card; pagination wraps as in Library.

## Prototype corrections that apply here

- **Fake "14 rows · 48 KB"** (line 2071): replaced with the real parsed row count and the uploaded `File`'s actual `size` (formatted, e.g. "487 rows · 62 KB").
- **Always-100% progress** (`{items.length} of {items.length}`, lines 1433/2362): replaced with the contract's real `Batch.classified` vs. `Batch.total`, advanced by the mock per poll, never a client array's own length compared to itself.
- **Hardcoded "Started today at 08:56"** (line 2347) and static title "November apparel import" (line 2346): both come from the real `Batch.filename` and `Batch.startedAt`.
- **Fake throttle banner that's really just a static warning with a client-only Pause toggle** (lines 2354-2378): replaced with the progress banner described above, backed by the batch's real `status` and real pause/resume mutations, not local `useState`.
- **Client-side `.forEach` bulk approve with no logged decisions** (lines 2404-2410): replaced with a server-side `POST /batches/:id/bulk-approve` that applies the real decision transition and appends a real `AuditEntry` per item, per `docs/api-contract.md`.
- **Export's "10 MB" limit and no row cap**: replaced with the brief's decided 5 MB / 500-row limits, enforced client-side at parse time (and the mock can reject an oversized multipart body as a defensive second check).
- **No `window.alert`/`confirm`**: none in the export; bulk-approve already routes through `Modal`.
- **Keyboard accessibility** (Shortcut 6, same `ProductTable`/`PortalMenu` defects): inherited already-fixed from `widgets/classification-table`/`Menu`, same as Library - nothing new to fix here, but the dropzone itself must be natively keyboard-operable (a real `<input type="file">`, never a bare `onClick` `<div>` as a `<button>` wrapping it is in the export, lines 2064-2072 - the export's dropzone actually is a real `<button>`, so this is a confirmation that pattern is kept, not a defect to fix).
- **FilterDropdown's global-search attribute / outside-click-only dropdown dismissal** (2186-2196, if `FilterDropdown` had been reused): moot, since this brief (like Library's) doesn't use `FilterDropdown` at all.

## Open questions for me

- **BU-1 RESOLVED**: the same grid pattern Home already uses for its review-queue/quick-add cards (no documented ratio in the export to match exactly).
- **BU-2 RESOLVED**: the four messages drafted under Exact copy, plus the empty-row-count and too-long-row-number messages added there.
- **BU-3 RESOLVED**: page-local (single consumer, no `design.md` spec to build a primitive against).
- **BU-4 RESOLVED**: a result-style return (not a thrown error) so the page can render inline errors without a try/catch at the call site - see the `shared/lib/parseCsv` section above.
- **BU-5 RESOLVED**: disabled selects with a hint line until parsed; parse errors hide the mapping card entirely until a valid file is provided.
- **BR-1 RESOLVED**: without the extension (`"June apparel import"` rather than `"june_apparel_import.csv"`), matching how the export's static title reads as a human title rather than a filename.
- **BR-2 RESOLVED**: not dismissible while `status !== "complete"`; dismissible once `status === "complete"` - see the Progress banner section above.
- **BR-3 RESOLVED**: a dedicated not-found-style message with a link to `routes.batchUpload`, distinct from the generic `ErrorState` retry (a 404 can't be fixed by retrying).
- **BR-4 RESOLVED**: 2000ms, matching the existing agent-run polling cadence, with a `pollIntervalMs` override for tests.
- **BR-5 RESOLVED**: omit the "Updated" column (matches the export's compact table and Home's precedent, as opposed to Library's non-compact one which does show it).
- **BR-6 RESOLVED**: `entities/review-rule` is promoted from `pages/settings` in this task, because Batch review is the second consumer (its bulk-approve threshold reads `highlightAbove`). Settings' own tests continue to pass unchanged against the new import path, matching how `entities/member` was promoted in the Settings task.

## Plan usage and limits (plans, limits and expiry, step 3b)

Read from `useWorkspace` (limits, usage). The server enforces the same rules; its refusals are handled too. Notices use `PlanLimitNotice` (`entities/workspace`) with `planLimitMessage`.

- **Usage lines** above the cards: "Batch uploads: {used} of {limit} used this month. Up to {maxRows} rows per upload." (or "Batch uploads: not included in your plan.") and the classification quota line shared with Classify new. Skeleton while the workspace loads; if it fails, no lines and no blocking.
- **No batch in the plan** (`maxRows` 0): notice reason "feature"; file chooser, "Choose file" and submit disabled.
- **Uploads used up** (`batchUploadsUsed >= uploadsPerMonth`): notice reason "batch_uploads"; file chooser and submit disabled.
- **After a file is parsed**, rows are the non-empty descriptions (the same count the server uses). Rows over `maxRows`: notice reason "batch_rows". Rows over the remaining classifications (limit minus used, never below 0): notice reason "classifications" plus "You have {n} left, so choose a smaller file." Submit is disabled in both cases; the chooser stays enabled so a smaller file can be picked.
- Submit carries `aria-describedby` pointing at the notice. Only one notice shows at a time.
- **Server 403 `plan_limit_reached` on submit**: the matching notice replaces the generic error and the workspace is refetched. The server-derived notice shows only until a workspace fetch newer than the refusal arrives; after that the workspace data decides.
- After a successful upload the workspace query is invalidated.

## Acceptance criteria (testable)

- [ ] `shared/lib/parseCsv` correctly parses plain, quoted-with-commas, quoted-with-escaped-quotes, CRLF, and trailing-blank-line CSVs; rejects files over 5 MB or 500 rows; all covered by unit tests.
- [ ] Upload: real file input + dropzone, both keyboard-operable; row count, file size and detected headers all come from the actual parsed file, never fixed numbers; auto-match pre-fills obvious column mappings; Start is disabled until a file is parsed and every required field is mapped.
- [ ] Submitting creates a batch (`POST /batches`) and navigates to `/app/batches/:id` for the new batch.
- [ ] `entities/batch` exists (schema matching the contract exactly, keys, `useBatch`, `useBatchItems`) and is imported by both pages - no duplicate batch types.
- [ ] Batch review polls `GET /batches/:id` while not complete and stops polling once `status === "complete"`; progress is `classified`/`total` from real data, never `items.length` compared to itself.
- [ ] Progress banner shows real status and start time (`startedAt`, not a hardcoded clock string); Pause/Resume call real mutations.
- [ ] Bulk-approve's confirm modal shows the live derived count and the threshold from `entities/review-rule` (falling back to 90 if the rules haven't loaded); confirming calls the real bulk-approve endpoint and logs one audit entry per approved item.
- [ ] Table is `widgets/classification-table` (no duplicate table implementation); search/status-filter/pagination/row-menu/row-navigation/delete+Undo all behave as already specified for Library.
- [ ] No `FilterDropdown`, no client-only `.forEach` bulk approve, no fake "X of X" progress, no hardcoded filename/size/timestamp strings anywhere on either page.
- [ ] Loading, empty (filtered), error, and not-found (bad batch id) states are implemented on Batch review; parse-error and incomplete-mapping states are implemented on Batch upload.
- [ ] No raw colors/off-scale spacing; no new shared/ui component added beyond what's already `built`.
- [ ] Responsive at 375/768/1280 on both pages.
- [ ] `npm run check` passes.
