# Page brief: Classification detail

Status: approved
Route: `/app/classifications/:id` | FSD slice: `pages/classification-detail`, plus `features/review-decision` (new), reuses `entities/classification` (from the Home brief)

Decisions recorded on approval:

- CD-1: the task **starts** by moving Home's approve mutation into `features/review-decision`, as its own separate commit, before any detail-page work.
- CD-2: no `Button` variant. "Approved by …" is an `approved` `StatusIndicator` with text, non-interactive.
- CD-3: "Overridden" is derived from the record (`overridden: true`); no new prop on `ClassificationStatusBadge`.
- CD-4: yes, add `model` to the contract; render with `SampleLabel`.
- CD-6: render each candidate's `reasoning` from data; the static explanation paragraph is dropped.
- CD-9: the members query stays page-local in `pages/classification-detail/api`; there is no `entities/member`.
- CD-5, CD-7, CD-8, CD-10: defaults as written. Where a line below still says "DEFAULT", that default is the approved behavior.

Contract note: the decision endpoint `POST /classifications/:id/decision` accepts exactly these actions: `approve`, `reject`, `override`, `request_info`, `undo`. Deletion is only `DELETE /classifications/:id` and is never a decision action. This page uses the five decision actions and has no delete.

## Design reference

- Figma URL / node: https://www.figma.com/make/v8wpvjs0lOovob7BIzYKzu/HS-Copilot-Classification-Workspace (fileKey `v8wpvjs0lOovob7BIzYKzu`, node `0:1`) - Make file, source only.
- Screenshots: `design/screens/classification-detail.png`, `design/screens/classification-detail.mobile.png`. No tablet screenshot. Note the mobile screenshot shows the prototype's audit panel bleeding behind the page content; that is a prototype bug, not a layout to copy.
- Make source (via `docs/make-export-index.md`): `ResultScreen` (1572-2051). Also read for context: `ProductTable` delete flow is not used here. The reject/override/ask-info modals are inside `ResultScreen` (1926-2048).
- Visuals come only from `design.md`. The export's navy accent, uppercase eyebrows, pill chips and red Override button are stale or wrong (see corrections).

## Purpose and user goal

The core review screen. A reviewer sees the ranked candidate codes with the evidence behind them, then decides: approve the recommended code, reject it (with a reason), override it with a different code (with a reason), or ask a colleague for more information. Every decision is recorded in an audit trail the reviewer can open.

## Layout and sections (top to bottom)

Single main column, max content width 1280 (design.md §4). The audit trail and evidence views open in the existing `Drawer` (right side, 320px, overlay).

1. **Back control**: ghost `Button` with `ArrowLeft`, "Back".
2. **`PageHeader`**: eyebrow "Classification result", H1 = classification description, description line = "`{jurisdiction label}` · Researched `{day}` at `{time}`" (both derived, see Data). Action: secondary `Button` "Audit trail" (icon `PanelRight`) opens the drawer.
3. **Recommendation `Card`** (accent border, per export; padding `--space-4`):
   - Left: label "Recommended code", the code large in `--font-mono` (`CodeText`, hero size = H1 28/36 per design.md, no oversized text), then the status indicators: `StatusIndicator` for status and, when `overridden`, a second `StatusIndicator` "Overridden" next to it.
   - Right: label "Overall confidence" + `Meter`.
   - H2 = classification description, then a row of citation chips (see Data: from `evidence[]`, icon by `kind`). The export's static explanation paragraph is dropped (CD-6); the explanation is each candidate's own reasoning, shown in the Ranked candidates section.
4. **Review actions row** (flex, wraps, gap `--space-1`): Approve, Override code, Reject, Ask for more info (see Interactions for states and variants).
5. **Ranked candidates** section: eyebrow "Ranked candidates", H2 "Top suggestions", then a list of candidate `Card`s, 3 in the mock data. Each card: rank "01"/"02"/"03" (computed from position), code (`CodeText`) + candidate title, `Meter`, and a "View reasoning" disclosure button (icon `ArrowRight`). The card whose code equals the current effective code (`finalCode ?? suggestedCode`) uses the Card `selected` variant. Expanding shows that candidate's own reasoning steps as an ordered list (number, bold step title, body).
6. **Evidence grid**, two columns (one at `<=720`):
   - "Tariff text" `Card`: eyebrow, H3 = evidence `title`, blockquote with `excerpt`, "Open source" link-button (opens the drawer source view).
   - "Similar past ruling" `Card`: eyebrow, H3 = evidence `reference` followed by `SampleLabel` when `isSample`, `excerpt`, "View ruling" link-button.
   - A card is omitted if the classification has no evidence of that kind.
7. **Drawer** (closed by default, see `CD-7`): three views in one component, see Drawer section.

Modals (shared `Modal`): Reject, Override, Ask for more information. Toasts via shared `Toast`.

## Exact copy

Page and cards:

- "Back", "Classification result", "Audit trail", "Recommended code", "Overall confidence", "Ranked candidates", "Top suggestions", "View reasoning" / "Hide reasoning", "Tariff text", "Open source", "Similar past ruling", "View ruling".
- Description line pattern: "`United States` · Researched `today` at `09:18`" (day word "today" / "yesterday" / "on Nov 12").
- No static explanation paragraph. Reasoning step titles and bodies come only from `candidate.reasoning[]`. The export hard-coded "Identify essential character / Apply heading terms / Check exclusions / Compare precedent"; the mock candidates carry these titles as data.

Actions:

- Buttons: "Approve `{code}`", "Override code", "Reject", "Ask for more info".
- Approved state replaces the Approve button with an `approved` `StatusIndicator` whose text is "Approved by `{name}`" (non-interactive, not a button), followed by a text button "Undo".
- Toasts: "Classification approved" (success), "Approval undone", "Classification overridden" (success), "Classification rejected", "Information request sent".

Reject modal: title "Reject classification"; field "Reason" (**required**, no "(optional)"), placeholder "Add context for the rejection."; buttons "Cancel", "Reject". Validation: "Enter a reason for rejecting this classification."

Override modal: title "Override classification code"; field "Search HS code" (native input + datalist), placeholder "Type a code or product"; field "Reason for override" (textarea, required), placeholder "Explain why the suggested code is not appropriate."; buttons "Cancel", "Confirm override". Validation: "Enter a valid HS code, for example 8518.30.", "Choose a code other than the current one." (new copy, `CD-5`), "Enter a reason for the override."

Ask-for-info modal: title "Ask for more information"; "Assign to" select (people from the workspace, first option a placeholder "Select a person", required), "Note" textarea (optional), placeholder "Describe the missing product details."; buttons "Cancel", "Send request". Validation: "Select who should follow up." (new copy).

Drawer, audit view: eyebrow "Record", H2 "Audit trail", close button `aria-label="Close audit trail"`; meta rows "Jurisdiction" (`United States`), "Model version" (see `CD-4`), "Sources" (`{n} documents`, singular "1 document").
Drawer, source view: eyebrow "Evidence", H2 "Tariff source". Ruling view: H2 "Past ruling". Caption = evidence `reference` (+ `SampleLabel` if `isSample`), H3 = evidence `title`, body = `excerpt`. If `sourceUrl` exists, a link "Open original source" (new copy, only rendered when present).

Audit entry titles (mapped from the entry's `action` code in `entities/classification/lib`): "Classification started", "Product details confirmed", "Research completed", "Classification approved", "Approval undone", "Code overridden", "Classification rejected", "More information requested". Details are built by the server at write time, e.g. "Created by Alex Morgan.", "Three candidates ranked from 14 sources." (count = evidence length), "Alex Morgan approved 8518.30.", "8518.30 changed to 8518.22. Reason: …", "Rejected by Alex Morgan. Reason: …", "Assigned to Mina Patel for follow-up."

States copy:

- Not found: EmptyState "Classification not found", description "It may have been deleted.", action "Back to library".
- Load error: ErrorState "We couldn't load this classification", "Try again".
- Decision failure (inline `role="alert"` under the actions row, or inside the modal): "We couldn't save your decision. Try again." (new copy, `CD-5`).

## Components

| Element                                                                      | Component                                                   | Existing / New (+ proposed props)                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Page header, action                                                          | `PageHeader`, `Button`                                      | Existing                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Back control                                                                 | `Button` (ghost, `icon`)                                    | Existing                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Cards (recommendation, candidates, evidence)                                 | `Card` (default, `selected`)                                | Existing                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Status                                                                       | `ClassificationStatusBadge` (wraps `StatusIndicator`)       | From Home brief, **unchanged** (no new prop).                                                                                                                                                                                                                                                                                                                                                                                         |
| Overridden indicator                                                         | `StatusIndicator status="overridden"`                       | Existing (note: the code component is `StatusIndicator`; the inventory still calls it Badge). The page renders it next to the status badge when `classification.overridden` is true (derived from the record, CD-3).                                                                                                                                                                                                                  |
| "Approved by …"                                                              | `StatusIndicator status="approved"` with children text      | Existing. `StatusIndicator` currently renders only its fixed label; showing "Approved by `{name}`" needs the page to render the dot plus text itself, or a `children`/`label` override. DEFAULT: if `StatusIndicator` cannot take custom text without an API change, use the approved dot via the existing token classes inside page-local markup and report it as a deviation; do not change `StatusIndicator`'s API without asking. |
| Confidence                                                                   | `Meter` (`ConfidenceMeter` entity wrapper if Home built it) | Existing                                                                                                                                                                                                                                                                                                                                                                                                                              |
| HS code display                                                              | `CodeText`                                                  | Entity-local (`entities/classification/ui`), listed in the inventory but check if Home built it; else new here                                                                                                                                                                                                                                                                                                                        |
| Sample marker                                                                | `SampleLabel`                                               | Existing                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Audit trail + evidence drawer                                                | `Drawer` (`side="right"`, `returnFocusRef`)                 | Existing, no API change. Content is page-local (`AuditTrail`, `EvidenceView`). The drawer has no built-in close button, so the content header uses `IconButton` calling `onOpenChange(false)`.                                                                                                                                                                                                                                        |
| Close button                                                                 | `IconButton`                                                | Existing                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Reject / override / ask-info dialogs                                         | `Modal`                                                     | **New, from Home brief** (Radix dialog inside). Detail is not the first consumer; build here only if Home has not landed.                                                                                                                                                                                                                                                                                                             |
| Action feedback                                                              | `Toast` (provider + hook)                                   | **New, from Home brief**, same note                                                                                                                                                                                                                                                                                                                                                                                                   |
| Textareas, inputs, select                                                    | `FormField` + `Textarea` / `TextInput` / `Select`           | Existing                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Load error                                                                   | `ErrorState`                                                | **New** (planned in inventory), shared with the other two briefs                                                                                                                                                                                                                                                                                                                                                                      |
| Not-found / no candidates                                                    | `EmptyState`                                                | Existing                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Loading                                                                      | `Skeleton`                                                  | Existing                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Candidate card, reasoning list, citation chips, review actions, drawer views | page-local components in `pages/classification-detail/ui`   | New, page-local                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Decision forms and mutations                                                 | `features/review-decision`                                  | **New feature**: `ui/RejectDialog`, `OverrideDialog`, `RequestInfoDialog`, `api/useReviewDecision.ts`, `model/decision.schema.ts` (zod form schemas). Its first content is Home's approve mutation, moved in the preparatory commit (see Data).                                                                                                                                                                                       |
| Assignee list                                                                | `useMembers()`                                              | **New, page-local**: `pages/classification-detail/api/members.query.ts` plus its schema and key in the same segment. No `entities/member`.                                                                                                                                                                                                                                                                                            |

Approved state (CD-2, decided): no `Button` variant is added. "Approved by `{name}`" is a non-interactive approved status indicator (green dot plus text, design.md §5 Status indicator), not the green-tint chip-style button mentioned in design.md's Button section. This is a deliberate deviation from that Button exception and will be reported at the end of the task.

No `Tabs`, `Pagination`, `FilterDropdown` on this page.

## Data

### Contract changes (update `docs/api-contract.md` first, then schemas, then handlers)

0. The decision endpoint's `action` is exactly `approve | reject | override | request_info | undo`. Nothing else is a decision. Deletion is only `DELETE /classifications/:id`.
1. `POST /classifications/:id/decision` already lists the body. Add the response: **200 returns the updated `Classification`**. Add the validation rules the server enforces: `reject` requires non-empty `reason`; `override` requires `code` (valid HS code format) and non-empty `reason`; `request_info` requires `assigneeId`; `approve` optionally carries `code` (omitted = the suggested code). Violations return 422 `{ error: { code: "validation_error", details } }`.
2. Status transitions (the server, and the mock, apply exactly these):
   - `approve`: `status: approved`, `finalCode = code ?? suggestedCode`, `overridden: false`.
   - `override`: `status: approved`, `finalCode = code`, `overridden: true` (stays final; **not** `rejected`).
   - `reject`: `status: rejected`, `finalCode` cleared, `overridden: false`.
   - `request_info`: `status: pending`.
   - `undo`: back to `needs_review`, `finalCode` cleared, `overridden: false`.
3. Every decision appends one `AuditEntry` (`id`, `at` = server now, `actor`, `action` code, `detail`) and returns it inside `auditTrail`.
4. `AuditEntry.action` holds a stable code (`created`, `details_confirmed`, `research_completed`, `approved`, `approval_undone`, `overridden`, `rejected`, `info_requested`); the UI maps it to a title (DEFAULT, `CD-8`).
5. Model version (CD-4, approved): add optional `model?: { version: string; isSample?: boolean }` to `Classification` so "Model version" renders from data, with `SampleLabel` when `isSample`. If `model` is absent the row is hidden. Contract first, then schema (in `entities/classification`), then handlers and fixtures.
6. `GET /classifications/:id` already returns candidates, evidence, auditTrail. `GET /members` (list) is used for the assignee select (see below).

### Preparatory step (separate commit, first)

Before any detail-page work: move Home's approve mutation (`pages/home/api`'s `useApproveClassification`) into `features/review-decision` as the first decision hook, repoint Home to import it from `@/features/review-decision`, keep its behavior and tests, and move its test with it. This is one commit by itself ("refactor(review-decision): ..."), checked with `npm run check`, so Home's behavior change is reviewable on its own. If Home's approve mutation does not exist yet when this task starts, say so and stop for direction instead of inventing it. Home's delete mutation is not part of this step (it is not a decision; see Library).

### Entities and queries

- `entities/classification` (Home brief creates the slice): this task adds `useClassification(id)` (`GET /classifications/:id`), `classificationKeys.detail(id)`, the `Candidate`/`Evidence`/`AuditEntry` parts of the schema if Home only used the list shape (Home's brief already specifies the full schema), and `lib/`: `hsCode.ts` (`isValidHsCode(code, jurisdiction)`: digit count per destination from `DESTINATIONS`, separators ignored; domain knowledge lives in the entity), `jurisdictionLabel.ts` (the six destination names, from `DESTINATIONS`), `auditActionLabel.ts`, `effectiveCode(c)`.
- Members (CD-9, decided): `GET /members` is read by a page-local query in `pages/classification-detail/api` (`members.schema.ts`, `members.keys.ts`, `members.query.ts` with `useMembers()`), used only to fill the "Assign to" select. No `entities/member`. When Settings → Members needs the same data it promotes the query to an entity then.
- `features/review-decision/api`: `useReviewDecision` as one mutation hook taking a discriminated union typed from the contract, one of `approve`, `reject`, `override`, `request_info`, `undo`. Approve comes from the preparatory commit; this task adds the other four. On success: `queryClient.setQueryData(classificationKeys.detail(id), response)` and `invalidateQueries(classificationKeys.lists())`. The feature, not the page, owns these mutations because Home and Library also approve (CD-1).

### Derived values (nothing hard-coded)

- Rank: position in `candidates` sorted by `confidence` desc, shown zero-padded.
- Citation chips: one per `evidence` item (`reference`, or `title` if shorter), icon `BookOpen` for `tariff_text`, `History` for `ruling`. The export's "GRI 1 and 6" and "chapter notes" chips become evidence entries in the fixtures.
- "Researched {day} at {time}": from the `research_completed` audit entry's `at` (fallback `createdAt`), formatted with `Intl.DateTimeFormat` / `Intl.RelativeTimeFormat` in new `shared/lib/formatDate.ts` (`formatTime`, `formatDay`). No date library (CLAUDE.md §2).
- "Approved by {name}": actor of the latest `approved` or `overridden` audit entry.
- "Sources": `evidence.length`. The audit "from 14 sources" text is generated from the same array length in the fixtures.
- Audit entry times: `formatTime(at)` for today, otherwise "Nov 12, 09:18"; newest first.
- Jurisdiction label from the entity lib.
- Actor name for new entries: the mock handler uses the signed-in mock session's name (the same fixture the session entity uses); in the real API the actor is the authenticated user.

### Mock data (MSW, extends the Home fixtures)

- Handlers: `GET /classifications/:id` (404 `not_found` for unknown ids), `POST /classifications/:id/decision` (exactly the five actions `approve`, `reject`, `override`, `request_info`, `undo`; any other action returns 422; validation per the contract; appends an audit entry with real `at`), `GET /members` (Alex Morgan, Mina Patel, Jordan Lee, from the export's members seed 2497-2519, with ids and roles). Latency 300-700 ms; `forceError` and `forceDelay` honored.
- Fixtures: the 14 classifications from the Home brief. Each must have 3 candidates with distinct confidences and **per-candidate reasoning** (the export reused the top candidate's reasoning for all three; fixing that means writing short distinct reasoning for the alternatives), a tariff-text evidence and a ruling evidence (`isSample: true`), and a 3-entry seed audit trail with timestamps **relative to now** (computed when the store is created, e.g. created at now minus 2 days minus 2 minutes), never fixed clock strings.
- Edge cases to include: one needs_review item (the earbuds), one approved item, one overridden item, one rejected item, one pending item (info requested), one item with no ruling evidence, one with a single candidate.
- Decisions mutate the in-memory store so list pages (Home, Library) see the change after invalidation.

## States

- **Loading**: skeleton matching the final layout (page header block, recommendation card, two candidate cards, per the export's `result-skeleton`), no fixed 800 ms timer. The export's `setTimeout` loading is replaced by real query state.
- **Empty / partial**: if `candidates` is empty (research did not finish), recommendation and candidates sections are replaced by EmptyState "No candidates yet" with action "Back to library"; audit trail still available.
- **Not found**: 404 renders the not-found EmptyState.
- **Error**: ErrorState with "Try again" (`refetch()`), distinct from the whole-app health screens.
- **Mutating**: the clicked action `Button` shows loading, all four action buttons are disabled to prevent concurrent decisions, modals disable submit.
- **Decided**: approved (with/without Overridden), rejected, pending, needs review. See action matrix below.
- **Permission**: no role gating this task (`CD-10`).

### Action matrix

| Status                    | Approve                                          | Override | Reject                            | Ask for info | Extra                            |
| ------------------------- | ------------------------------------------------ | -------- | --------------------------------- | ------------ | -------------------------------- |
| needs_review              | "Approve `{code}`"                               | shown    | shown                             | shown        | none                             |
| pending                   | "Approve `{code}`"                               | shown    | shown                             | shown        | none                             |
| approved (and overridden) | replaced by "Approved by `{name}`" chip + "Undo" | shown    | shown                             | shown        | Overridden indicator if flag set |
| rejected                  | "Approve `{code}`"                               | shown    | shown (re-reject with new reason) | shown        | none                             |

Button variants: Approve = `approve`; Override code = `secondary` (ink outline, **not** red); Reject = `reject`; Ask for more info = `secondary`. Icons: `Check`, `PencilLine`, `XCircle`, `CircleHelp`.

## Interactions

- **Approve**: immediate mutation (`action: approve`), no confirm (consistent with the Home brief), toast "Classification approved". Approves the recommended code. Choosing a different candidate is an override (see below), so there is exactly one path for "not the top code".
- **Undo** (approved state only, as in the export): `action: undo`, toast "Approval undone". Returns to needs_review.
- **Reject**: opens the Reject modal; reason required (client validation with zod plus server 422). Submit disabled while pending; on success closes, toast "Classification rejected". Status becomes rejected, `overridden` false, `finalCode` cleared.
- **Override**: opens the Override modal; code (native input with a `datalist` of this classification's candidates, title shown as the option label) and reason both required. Free-typed codes are allowed if they match the HS format. Success: status approved, `overridden: true`, `finalCode` set; toast "Classification overridden". It is a different action and endpoint call from Reject and never changes status to rejected.
- **Ask for more info**: modal with assignee (required) and optional note; sends `request_info`; status becomes pending; toast "Information request sent".
- **Audit trail**: "Audit trail" button opens the existing `Drawer` (not auto-opened by decisions, `CD-7`); list updates live because the cache is replaced by the mutation response. `returnFocusRef` points to the opener (Audit trail button, "Open source" or "View ruling").
- **Evidence views**: "Open source" and "View ruling" open the same Drawer with a different view (source / ruling). Close with the close button, Esc, or outside click.
- **Reasoning**: "View reasoning" toggles a per-card disclosure (`aria-expanded`, `aria-controls`); one open at a time as in the export.
- **Back**: `navigate(-1)` when the user arrived from inside the app; falls back to `routes.library` on a direct visit (deep link).
- Modals: focus trapped, Esc closes, focus returns to the button that opened them, form state cleared on close.
- Keyboard: all actions are native buttons; candidate disclosure buttons are tabbable; no row-level click shims.
- `document.title`: "`{description}` · Classification" via `useDocumentTitle`.

## Responsive behavior

- `<=1000px`: `Drawer` is full width (existing behavior). Content stays one column.
- `<=720px`: page header action stacks under the title (existing `PageHeader`). Recommendation top row wraps (code above confidence). Review actions wrap two per row (matches the mobile screenshot). Candidate card changes from `40px | 1fr | 120px | auto` to rank + content, with Meter and "View reasoning" on their own lines below (matches the screenshot). Evidence grid becomes one column. Modals use `min(100%, 520px)`.
- Touch targets 40px everywhere.

## Prototype corrections that apply here

- **Override styled as reject** (1763-1765, and the modal confirm button at 1974): Override uses `secondary`; "Confirm override" uses `primary`. Red remains reserved for reject/error/delete (design.md §2). Overridden outcome is `approved` + `overridden: true`, shown with its own `--status-overridden` indicator.
- **Reject reason optional** (1998, defaulted to canned text at 1990): reason is now required, validated client-side and by the server.
- **Row-menu "Override code" that only opens the item** (460): not on this page; the Home and Library row menus omit it. Override lives here.
- **Hard-coded counts**: "14 sources" (1602) and "14 documents" (1902) now derive from `evidence.length`. Candidate confidences 41 and 18 (1634, 1640) come from data.
- **Fake clock times**: "09:18/09:17/09:16" (1598-1610), "Researched today at 09:18" (1680), and "Now" for new entries are replaced by real timestamps formatted with `Intl`; the mock appends an entry with the real time on each decision.
- **Audit entry appended only client-side** (1621): the server (mock handler) now appends it, and the page reads it back from the response.
- **Same reasoning for every candidate** (1807-1828): each candidate renders its own `reasoning[]`.
- **Static explanation paragraph** (1712-1716), identical for every classification: dropped (CD-6).
- **Fixed 800 ms loading timer** (1615): real query loading.
- **Hard-coded names** "Alex Morgan" (1731-1754), "Mina Patel" (2025, 2032): actors come from the session, assignees from `GET /members`.
- **Hard-coded static evidence text and "US HTS · 2026 revision"** (1909), plus the fixed GRI paragraph (1919-1921): the drawer shows only the evidence item's own `reference`, `title`, `excerpt`. The fixed GRI paragraph is dropped because it is a static claim shown for every classification.
- **Drawer open by default and re-opened after every decision** (1589, 1622): closed by default, not auto-opened (the Drawer is a focus-trapping overlay; popping it open after a click would steal focus).
- **State-based navigation** (`go(backTo)`): router URLs; deep link `/app/classifications/:id` works; Back uses history.
- **`window.alert/confirm`**: none in the export; all feedback via Modal and Toast.
- **Sparkles/decoration**: none on this page.

## Open questions for me

None. CD-1 to CD-10 are resolved above.

## Acceptance criteria (testable)

- [ ] The preparatory commit exists on its own: Home's approve mutation lives in `features/review-decision`, Home imports it from there, Home's tests still pass, and no detail-page code is in that commit.
- [ ] Only the five actions `approve`, `reject`, `override`, `request_info`, `undo` are sent to the decision endpoint; the page never sends a delete.
- [ ] Page loads `GET /classifications/:id`; skeleton while loading; 404 shows the not-found state; failure shows ErrorState with a working "Try again".
- [ ] Candidates render in confidence order with computed ranks, each with its own reasoning; the row matching `finalCode ?? suggestedCode` is `selected`.
- [ ] Citation chips, tariff-text card, ruling card, and the Sources count all derive from `evidence[]`; no hard-coded "14". No static explanation paragraph exists; reasoning shows only `candidate.reasoning[]`.
- [ ] "Model version" renders from `model` with `SampleLabel` when `isSample`, and is hidden when `model` is absent.
- [ ] The members list comes from a query in `pages/classification-detail/api`; there is no `entities/member` slice.
- [ ] "Researched ... at ..." and every audit time are produced by `Intl` from timestamps; no literal clock strings in source or fixtures.
- [ ] Approve sends `{action:"approve"}`, updates the page without a refetch flash, shows "Approved by {name}" as a non-interactive approved `StatusIndicator` (not a button, no new `Button` variant) and a toast, and appends a mock audit entry visible in the drawer.
- [ ] Reject cannot be submitted without a reason (client error shown, no request); the server also returns 422 for an empty reason; success sets status `rejected`.
- [ ] Override requires a valid HS code (different from the current one) and a reason; success sets `status: approved`, `overridden: true`, `finalCode`, shows both Approved and Overridden indicators, and is **not** displayed or stored as rejected.
- [ ] Override button and Override confirm button are not styled with the reject variant or red; Reject keeps the reject variant.
- [ ] Ask for more info requires an assignee from `GET /members`; success sets status `pending`.
- [ ] Undo (approved state) returns the item to needs_review, clears `finalCode` and `overridden`, appends an audit entry.
- [ ] Each of the five decisions appends exactly one audit entry with a real timestamp, actor and detail; the entry appears newest-first in the drawer.
- [ ] Audit trail, source and ruling views use the existing `Drawer`; Esc closes; focus returns to the opener; drawer is full overlay at `<=1000px`.
- [ ] All action buttons are disabled while a decision is pending; a failed decision shows an inline error and leaves state unchanged.
- [ ] Decision changes are visible on Home and Library after navigation (list queries invalidated).
- [ ] Back works with history and falls back to the library on a direct visit; the browser Back button works.
- [ ] Modals trap focus, close on Esc, return focus; no `window.alert`/`confirm` anywhere.
- [ ] Responsive at 375 / 768 / 1280 per the layout rules above; layout does not copy the prototype's overlapping drawer.
- [ ] No raw colors or off-scale spacing; `docs/component-inventory.md` updated (`ErrorState`, `Modal`/`Toast` if built here, `CodeText`; no `Button` change).
- [ ] Tests: reducer-free mutation tests per action against MSW (success + 422 + network error), the three dialogs (validation, submit, cancel, focus return), page states (loading, not found, error, each status matrix row), audit drawer ordering and live update.
- [ ] `npm run check` passes.
