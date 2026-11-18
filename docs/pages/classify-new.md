# Page brief: Classify new

Status: approved
Route: `/app/classify/new` | FSD slice: `pages/classify-new`, plus `entities/agent-run` (new), reuses `entities/classification` (from the Home brief)

Decisions recorded on approval: CN-1, CN-2, CN-3, CN-5 accepted as written. CN-4: keep `?run=<id>`, but mock run state resets on reload, so a "Run not found" state is added. CN-6: description is non-empty and at most 1000 characters. No `react-hook-form`: the form uses `useState` plus zod, like the auth forms. Where a line below still says "DEFAULT", that default is the approved behavior.

Contract note: the decision endpoint (`POST /classifications/:id/decision`) takes the actions `approve`, `reject`, `override`, `request_info` and `undo`; this page does not call it. Deletion is only `DELETE /classifications/:id`; it is not a decision action. This page does neither.

## Design reference

- Figma URL / node: https://www.figma.com/make/v8wpvjs0lOovob7BIzYKzu/HS-Copilot-Classification-Workspace (fileKey `v8wpvjs0lOovob7BIzYKzu`, node `0:1`) — Make file, source only. Not re-queried; the frozen export and screenshots below are the layout and copy reference.
- Screenshots: `design/screens/classify-new.png` (desktop), `design/screens/classify-new.mobile.png`. No tablet screenshot exists.
- Make source (via `docs/make-export-index.md`): `NewClassification` (1446-1567). Also read for context: `AppShell` is already built.
- Visuals (color, font, radius, shadow) come only from `design.md`. The export and screenshots show a navy accent, uppercase eyebrows and boxed cards that are stale.

## Purpose and user goal

Describe one product in plain language, start an AI research run, watch its progress, answer at most one clarifying question, and land on the classification detail page when the run finishes.

## Layout and sections (top to bottom)

1. `PageHeader`: eyebrow "New classification", H1 "Describe the product", description "Include the details a reviewer would need to distinguish between headings." No action.
2. Two-column grid, **5fr / 7fr**, gap `--space-3`, aligned to start (from the export's `.classification-grid`):
   - **Left: form `Card`**
     - `FormField` + `Textarea` "Product description" (min height 120 per design.md).
     - Two-column row: `TextInput` "Primary material (optional)" and `TextInput` "Intended use (optional)".
     - `FormField` + `Select` "Country of origin (optional)".
     - Action row, right-aligned, top border `--line`: primary `Button` "Research HS codes" (icon `Search`, see Prototype corrections for why not `Sparkles`).
   - **Right: "Research progress" `Card`**
     - Heading block: eyebrow "Live agent", H2 "Research progress". While a run is working and no question is open, plain text "Working" on the right (no dot, no animation).
     - Body, one of: empty (`FileSearch` icon + line), steps list, error.
     - Below the steps, when the run has a question: the clarifying-question block.
3. At `<=1000px` the grid is one column: form first, progress second (matches the mobile screenshot).

## Exact copy

- Header: "New classification" / "Describe the product" / "Include the details a reviewer would need to distinguish between headings."
- Labels: "Product description", "Primary material (optional)", "Intended use (optional)", "Country of origin (optional)".
- Placeholders: material "e.g. ABS plastic", use "e.g. Personal audio". The export's description has no placeholder; DEFAULT: "e.g. Wireless Bluetooth earbuds with charging case" (reuses the export's sample text as a hint instead of a prefilled value).
- Country options: "China", "Vietnam", "Unknown" (as in the export). DEFAULT value on load: "Unknown".
- Button: "Research HS codes". While submitting: same label with the Button loading state.
- Progress card empty state: "The agent’s research steps will appear here."
- Steps (titles from the export; details come from the run data, copy shown is what the mock supplies):
  1. "Extract product attributes" — detail: the submitted description.
  2. "Search tariff headings" — "Compared candidate headings based on material, construction, and use"
  3. "Apply heading notes" — active: "Reviewing chapter and explanatory notes"; paused: "Paused for a clarifying detail"
  4. "Rank candidates" — waiting: "Waiting"
- Clarifying block: label "Clarifying question" (icon `AlertCircle`), question text from data (mock: "Is the product’s principal function fully described above?"), options from data (mock: "Yes / The description covers its primary use", "No / The product has another important function", "I’m not sure / Continue with lower confidence").
- New copy (not in the export, needed for states; flagged as questions `CN-5`, `CN-6`):
  - Description required error: "Enter a product description."
  - Description too long error: "Use 1000 characters or fewer." (checked by zod on submit, so pasted text is never silently cut)
  - Run not found: EmptyState title "Run not found", description "This research run is no longer available. Start a new one.", action link "Start again" to `routes.classifyNew` (new copy)
  - Create-run failure (under the action row, `role="alert"`): "We couldn't start the research. Try again."
  - Progress failure: ErrorState title "We couldn't load the research progress" with "Try again".
  - Answer failure (inside the question block): "We couldn't send your answer. Try again."

## Components

| Element | Component | Existing / New (+ proposed props) |
| --- | --- | --- |
| Page header | `PageHeader` | Existing |
| Form card, progress card | `Card` | Existing |
| Description, material, use | `FormField` + `Textarea` / `TextInput` | Existing |
| Country | `FormField` + `Select` (native) | Existing |
| Submit button | `Button` (primary, `icon`, `loading`) | Existing |
| Progress empty state | `EmptyState` (icon `FileSearch`, one line, no action — `action` is optional in the component) | Existing |
| Progress load failure | `ErrorState` | **New** (planned in inventory; see below) `{ title, description?, onRetry, retryLabel? }`. Built once for all three pages; if Home already built it, reuse. |
| Steps list | `AgentSteps` | **New, page-local** (`pages/classify-new/ui`). Presentational: `steps: { id, title, detail, state }[]`. Not a widget yet: only this page uses it. Promote to `widgets/agent-progress` if `/try` ever reuses it. |
| Clarifying question | `ClarifyingQuestion` | **New, page-local**: `{ text, options: {label, hint}[], isPending, error?, onAnswer(index) }` |
| Status text "Working" | plain text, `--muted` | n/a |

No new shared/ui other than `ErrorState`. `Tabs`, `Pagination`, `FilterDropdown`, `Modal`, `Toast`, `DataTable` are not used on this page.

Forms: **no `react-hook-form`** (decided). The form uses `useState` for values and errors plus zod `safeParse` on submit, the same pattern as the auth forms. No new dependency is needed for this page.

## Data

### Contract changes (update `docs/api-contract.md` first)

1. `POST /classifications` request body, currently unspecified: `{ description: string, attributes: { material?: string, intendedUse?: string, origin?: string }, jurisdiction: Jurisdiction }`. Response (already documented): `{ classificationId, agentRunId }`.
2. `GET /agent-runs/:id` and `POST /agent-runs/:id/answer` are already in the contract. DEFAULT: **no new fields**. Run completion is derived: the run is complete when every step has `state: "done"`. The run is waiting for the user when `question` is present. `POST .../answer` returns the updated `AgentRun`.

### Entities and files

- `entities/agent-run` (new): `model/agentRun.schema.ts` (zod from the contract), `api/agentRuns.keys.ts`, `api/agentRuns.query.ts` with `useAgentRun(id)` (`GET /agent-runs/:id`). Polling uses TanStack `refetchInterval`: returns 1000 ms while the run has steps not done **and** no `question`; returns `false` when complete or paused on a question. The interval is only a poll cadence; step state comes from the response, never a client timer. `model/agentRun.lib.ts`: `isRunComplete(run)`, `needsAnswer(run)`.
- `pages/classify-new/api` (page-local mutations, architecture rule 7: only this page creates runs or answers questions): `useCreateClassification` (`POST /classifications`), `useAnswerClarification` (`POST /agent-runs/:id/answer`, writes the response into the `agentRunKeys.detail(id)` cache). On completion the page invalidates `classificationKeys.lists()`.
- `pages/classify-new/model/classifyNew.schema.ts`: zod form schema (`description` trimmed, required, max 1000 characters; others optional). The `origin` value "Unknown" is sent as omitted. The same schema shape is checked by the mock handler (400/422 `validation_error` for empty or over-long descriptions).
- `GET /agent-runs/:id` for an id the mock store does not know (including every run after a page reload of the dev server, because mock run state is in memory and resets) returns 404 `not_found`; the page maps that to the Run not found state.
- Jurisdiction: the export form has no jurisdiction field but the contract requires one. DEFAULT: send `"US_HTS"` (the export's detail header reads "US HTS"), as a named constant in the page's `model`, until a workspace default exists. Question `CN-3`.

### MSW (`src/app/mocks/handlers/agentRuns.handlers.ts`, plus `POST /classifications` in the existing classifications handlers)

- `POST /classifications`: validates the body, creates a `needs_review`-bound classification record in the in-memory store with a pending run, returns `{ classificationId, agentRunId }`. Latency 300-700 ms, `forceError` and `forceDelay` honored.
- Run state machine in memory, keyed by run id. **Progress is driven by the request, not by a timer:** each `GET /agent-runs/:id` advances the run one transition and returns the new state:
  1. poll 1: step 1 done, step 2 active
  2. poll 2: step 2 done, step 3 active
  3. poll 3: step 3 `paused`, `question` present (always asked in mock mode; deterministic)
  4. further polls while a question is open return the same paused state
  5. `POST /answer`: step 3 done, step 4 active, question cleared
  6. next poll: step 4 done (run complete)
- Validation: answering with an out-of-range `optionIndex`, or when no question is open, returns 409/422 in the standard error shape.
- Question and option copy lives in the fixtures (`agentRuns.fixtures.ts`), typed with the entity type.
- The finished classification must exist in the store with candidates, evidence and an audit trail consistent with the detail page (research-completed audit entry timestamp = completion time, source count = `evidence.length`).

## States

- **Loading**: not applicable to the page shell (no data to fetch before the user types). While `POST /classifications` is in flight the submit Button shows its loading state and the form fields are disabled. While the first poll is in flight the progress card shows the steps with all four in `waiting` state, not a spinner.
- **Empty**: before any run, the progress card shows the `EmptyState` line.
- **Running**: steps reflect run data; screen-reader announcements via an `aria-live="polite"` region that announces the active step title on change.
- **Paused (clarifying question)**: step 3 paused, question block visible, option buttons enabled. Focus moves to the question heading when it appears.
- **Answering**: all option buttons disabled, `aria-busy="true"` on the block.
- **Complete**: all steps done; the page navigates to `routes.classificationDetail(classificationId)` with `replace: true` so Back does not return to a finished run.
- **Error**: create failure (inline under the action row, form re-enabled, values preserved), poll failure (`ErrorState` in the progress card, "Try again" calls `refetch()`), answer failure (inline in the question block, options re-enabled).
- **Permission**: none this task.
- **Partial**: a reload with `?run=<id>` asks the API for that run. With the real backend it resumes. With MSW, run state lives in memory and resets on reload, so it falls into Run not found.
- **Run not found**: poll returns 404 `not_found` for the `run` id. The form is re-enabled and still usable; the progress card shows the Run not found EmptyState with a "Start again" link that clears the `run` param. Not treated as a generic error (no "Try again", since retrying cannot succeed).

## Interactions

- Prefill: if `?q=<text>` is present (set by Home's quick-add), the description is initialised from it (decoded). The field is not auto-submitted.
- Submit: validate (description required) then `POST /classifications`. On success DEFAULT: `setSearchParams({ run: agentRunId })` (push, so the URL is linkable and a reload resumes the run) and the form becomes read-only until the run ends. Question `CN-4` (alternative: keep the run in component state only; a reload then loses it).
- Answer: clicking an option sends `optionIndex`. The options are real buttons (each a labelled name plus hint), keyboard operable, no radio semantics needed because the click submits.
- Run completion triggers navigation; no extra confirm.
- No cancel-run control (the export has none; no contract endpoint). Leaving the page leaves the run server-side.
- Enter in single-line inputs submits only when valid; the textarea keeps Enter as newline.
- Focus: on submit failure focus the first invalid field; on run start focus stays on the button's region and the live region announces progress.

## Responsive behavior

- `<=1000px`: grid becomes one column (form above progress). Form field row (material / use) stays two columns until `<=720px`.
- `<=720px`: material and use stack to one column; "Research HS codes" button full width is NOT in the export (it sits right-aligned, same size on mobile); DEFAULT keep as exported. Touch targets stay 40px.
- Progress card min-height: DEFAULT none beyond its content (the export's tall empty card is a layout artifact).

## Prototype corrections that apply here

- **Timer-driven progress** (`setTimeout(() => setQuestion(true), 500)`, 1484): replaced by request-driven run state from `GET /agent-runs/:id` as above.
- **Hard-coded step state**: the export renders step 3 paused/active from a boolean; here every step's state and text come from the run response.
- **`openTypedProduct` after any answer** (1548-1558): every option routed straight to the result screen and ignored the answer. Here the answer is sent, the run resumes, and navigation happens only on completion.
- **Prefilled description "Wireless Bluetooth earbuds with charging case" and default country China**: sample values presented as user input. Description starts empty (or from `?q=`), country defaults to "Unknown".
- **Dead "Save draft" button**: no contract endpoint and no draft entity in the export. Omitted (question `CN-1`).
- **Sparkles icon** on "Research HS codes" (1486): design.md §7 prohibits sparkle/AI decoration. Replaced with `Search`.
- **"Working" live-dot**: design.md prohibits pulsing/glowing dots. Rendered as plain "Working" text.
- Navigation uses router URLs; the description from Home arrives via the `q` search param (Home's contract).
- Counts and times: none on this page; nothing hard-coded.

## Open questions for me

None. CN-1 to CN-6 are resolved above.

## Acceptance criteria (testable)

- [ ] Description is required and limited to 1000 characters; empty shows "Enter a product description.", over-long shows "Use 1000 characters or fewer."; both focus the field and send no request.
- [ ] The form uses `useState` plus zod, with no `react-hook-form` import anywhere in the page.
- [ ] `?q=` prefills the description; the field remains editable.
- [ ] Submitting sends `POST /classifications` with the contract body and `jurisdiction`; the submit button shows loading and fields are disabled while pending.
- [ ] Step states, step details and the clarifying question render only from `GET /agent-runs/:id` data; there is no `setTimeout`/`setInterval` driving progress in the page code (polling is `refetchInterval`).
- [ ] While the run has a question, polling stops and the question block is shown; step 3 shows "Paused for a clarifying detail".
- [ ] Choosing an option calls `POST /agent-runs/:id/answer` with the correct `optionIndex`, disables the options while pending, and polling resumes after success.
- [ ] When every step is `done`, the page navigates (replace) to `/app/classifications/:id` of the created classification.
- [ ] Loading `/app/classify/new?run=<id>` for a run the API does not know (always the case after a reload in mock mode) shows "Run not found" with a "Start again" link that clears `run`; the form stays usable. A known run resumes.
- [ ] Create, poll and answer failures each show their own error state with a working retry; user-entered values are not lost.
- [ ] The progress region announces step changes through `aria-live="polite"`; the question block receives focus when it appears.
- [ ] Layout collapses to one column at `<=1000px` and the field row stacks at `<=720px`; checked at 375 / 768 / 1280.
- [ ] No raw colors or off-scale spacing; no `Sparkles` icon; no `Save draft` button.
- [ ] Tests: form validation (including the 1000-character limit), Run not found state, prefill from `q`, run lifecycle against MSW (poll, question, answer, complete, navigate), each error path, `AgentSteps` and `ClarifyingQuestion` unit tests.
- [ ] `docs/component-inventory.md` updated (`ErrorState` built); `npm run check` passes.
