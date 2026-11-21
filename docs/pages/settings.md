# Page brief: Settings

Status: approved
Route: `/app/settings/general`, `/app/settings/members`, `/app/settings/rules` | FSD slice: `pages/settings` (one page-local layout + three tab views), plus `entities/member` (new, promoted), `entities/review-rule` (new), reuses `entities/session`, `entities/workspace` is **not** created this task (workspace name/jurisdiction stay on `session`/a new workspace-settings query, see Data)

## Design reference

- Figma URL / node: https://www.figma.com/make/v8wpvjs0lOovob7BIzYKzu/HS-Copilot-Classification-Workspace (fileKey `v8wpvjs0lOovob7BIzYKzu`, node `0:1`) - Make file, source only.
- Screenshots: `design/screens/settings-general.png`/`.mobile.png`, `settings-members.png`/`.mobile.png`, `settings-rules.png`/`.mobile.png`. No tablet screenshots.
- Make source (via `docs/make-export-index.md`): `SettingsScreen` (2489-2857), `Toggle` (2468-2487), `Member` type (2460-2466), `PortalMenu` (392-426, member row menu), `Modal` (352-390, invite/remove dialogs).
- Visuals come only from `design.md` (the export's three-button `settings-nav`, pill status chips and toggle-switch skin are stale; colors/radius/shadow/typography are taken from `design.md`, never ported).

## Purpose and user goal

Manage the workspace's defaults, who has access and at what role, the thresholds and safeguards the review flow enforces, and the signed-in user's own account.

## Layout and sections (shared across all three routes)

A page-local two-column layout (`pages/settings/ui/SettingsLayout.tsx`), not a widget (single consumer):

1. `PageHeader`: no eyebrow, H1 "Settings & team", description "Manage workspace defaults, members, and review roles."
2. **Settings grid** (matches `design.md` §4's 12-column model; a narrow nav column + wide content column, collapsing to one column at `$bp-tablet`, same breakpoint Methodology/Home use for their two-column grids):
   - Left: a vertical nav of three `NavLink`s - "General", "Members", "Review rules" - to the three routes. `aria-current="page"` on the active link (DEFAULT: native semantics, no `Tabs` component - see Components).
   - Right: the active tab's content, swapped by the router (each tab is its own lazy route, not client-side tab state).
3. Each tab's content is its own `Card`(s), per tab below.

### General tab

- `Card` "Workspace defaults": `TextInput` "Workspace name", `Select` "Default destination" (the six `DESTINATIONS` of the entity's `Jurisdiction` union, with the helper text "Used as the starting value for new classifications. You can change it for each one." - the export's extra "Default reviewer" and "Time zone" fields are **cut**, see Prototype corrections), `Button` "Save changes" (disabled while the mutation is pending or the form is unchanged from the server values).
- `Card` "Account" (new section, not in the export - SG-1 decided it belongs here): `TextInput` "Display name" (editable), `TextInput` "Email" (read-only, `disabled`), `Button` "Sign out" (secondary).

### Members tab

- `Card` "Members": heading "Members", description `"People with access to {workspaceName}."`, action `Button` "Invite member" (icon `Plus`).
- A `DataTable` (reused, not the export's raw `<table>`): columns Name, Email, Role (a `Select` inline per row), Last active, Status (`StatusIndicator`-style: a dot plus "Active"/"Invited" - reusing the existing dot-plus-label pattern, not the export's `status--approved`/`status--pending` chip classes), row actions.
- `Card` "Role permissions": three rows, Admin / Reviewer / Analyst, each with the export's one-line description.
- Row menu (`Menu`, portal, as `DataTable`'s row-actions column): "Resend invite" (only for `status: invited` rows - new rule, see Prototype corrections) and "Remove" - no "Change role" item, since role is the inline `Select`, not a menu action.
- Invite `Modal`: email `TextInput` (type email, required) + role `Select` (Admin/Reviewer/Analyst, default Analyst), Cancel / "Send invite".
- Remove `Modal`: title "Remove member?", description `"{name} will lose access to this workspace."`, Cancel / "Remove" (reject-styled button, per `design.md`'s reject variant - the destructive action here).

### Review rules tab

- `Card` "Review rules": heading + description "Set thresholds and safeguards for classification decisions."
- Two `TextInput`s side by side (`type="number"`): "Highlight for approval above (%)" (`highlightAbove`), "Require review below (%)" (`requireReviewBelow`).
- Three `Toggle`s: "Require a clarifying question" (`requireClarifyingQuestion`), "Require a written reason for overrides" (`requireOverrideReason`), "Require a second approver for selected chapters" (gates the chapters field below).
- A chapters fieldset (`secondApproverChapters`): one `Checkbox` per chapter inside a native `<fieldset>`/`<legend>` (no new component - see Components), disabled when the second-approver toggle is off.
- `Button` "Save changes" (disabled while pending or clean) + `Button` "Discard" (secondary, replaces the export's "Reset to defaults" - SR-1 decided: discard reverts the form to the last-saved server values, it does not reset to hardcoded factory defaults, since "defaults" has no meaning once real values exist).

## Exact copy

- Title "Settings & team", description "Manage workspace defaults, members, and review roles."
- Nav: "General", "Members", "Review rules".
- General: "Workspace defaults", "Applied automatically to new classifications and batches.", "Workspace name", "Default destination", helper "Used as the starting value for new classifications. You can change it for each one.", "Save changes".
- Account: "Account", "Display name", "Email", "Sign out".
- Members: "Members", `"People with access to {workspaceName}."`, "Invite member", column headers "Name", "Email", "Role", "Last active", "Status", visually hidden "Actions"; "Role permissions", "Admin" / "Manage settings, members, and all decisions.", "Reviewer" / "Approve, reject, and override classifications.", "Analyst" / "Create and research classifications."
- Row menu: "Resend invite", "Remove".
- Invite modal: title "Invite member", "Email", placeholder "name@company.com", "Role", "Cancel", "Send invite".
- Remove modal: title "Remove member?", body `"{name} will lose access to this workspace."`, "Cancel", "Remove".
- Review rules: "Review rules", "Set thresholds and safeguards for classification decisions.", "Highlight for approval above (%)", "Require review below (%)", "Require a clarifying question" / "Ask when key product facts are missing.", "Require a written reason for overrides" / "Reviewers must document why they changed the suggestion.", "Require a second approver for selected chapters" / "Adds a second review step for the chapters selected below.", "Selected chapters", "Choose the chapters that need a second approver.", "Save changes", "Discard".
- Toasts: "Settings saved", "Review rules saved", "Invitation sent", "Invitation sent again", "Member removed" (with Undo), "Role updated".
- Validation errors: "Enter a value from 0 to 100." (threshold fields), "Enter a valid email address." (invite).
- Permission guard text (role restriction, see States): "Only admins can manage members." / "Only admins can change review rules."
- Load error: ErrorState "We couldn't load settings" with "Try again".

## Components

| Element                              | Component                                            | Existing / New (+ proposed props)                                                                                                                                       |
| ------------------------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Header                               | `PageHeader`                                         | Existing                                                                                                                                                                |
| Settings nav                         | `NavLink` (react-router) inside a page-local `<nav>` | No new component; `aria-current="page"` styled via `.active` class, no `Tabs` (see below)                                                                               |
| Cards                                | `Card`                                               | Existing                                                                                                                                                                |
| Inputs                               | `TextInput`, `Select`, `FormField`                   | Existing                                                                                                                                                                |
| Toggles                              | `Toggle`                                             | Existing (built, controlled: `checked` + `onChange`, replacing the export's uncontrolled `defaultChecked`)                                                              |
| Save/Discard/Invite/Sign out buttons | `Button`                                             | Existing                                                                                                                                                                |
| Members table                        | `DataTable`                                          | Existing                                                                                                                                                                |
| Row menu                             | `Menu`                                               | Existing                                                                                                                                                                |
| Invite / Remove dialogs              | `Modal`                                              | Existing                                                                                                                                                                |
| Toasts                               | `Toast`                                              | Existing                                                                                                                                                                |
| Loading                              | `Skeleton`                                           | Existing                                                                                                                                                                |
| Load error                           | `ErrorState`                                         | Existing                                                                                                                                                                |
| Status (member Active/Invited)       | `StatusIndicator`                                    | Existing - generalized beyond classification statuses; a dot colored by a new local mapping (`active` → `--green`, `invited` → `--status-pending`), not a new component |
| Chapters fieldset                    | `Checkbox` per chapter inside a native `<fieldset>`  | Existing components only, no new one (see "Which of Tabs/FilterDropdown" below)                                                                                         |
| Permission banner                    | `Banner`                                             | Existing (amber, dismissible - shown when a non-admin lands on Members/Review rules, see States)                                                                        |

### Which of Tabs, FilterDropdown does Settings need?

- **Tabs: no.** CLAUDE.md's decision (already made, restated here) is three real routes with `NavLink`s, not the `shared/ui` `Tabs` component. `Tabs` stays `planned` in the inventory until a page needs client-side tab switching without distinct URLs; Settings is not that case.
- **FilterDropdown: no.** Nothing here filters a list.
- **No new shared/ui component this task.** Every element maps to something already `built`.

## Data

### Entities

- **`entities/member` (new, promoted from `pages/classification-detail/api`)**: move `members.schema.ts` → `entities/member/model/member.schema.ts`, `members.keys.ts` → `entities/member/api/member.keys.ts`, `members.query.ts` → `entities/member/api/member.query.ts` (rename `useMembers`'s file only; the hook name and behavior are unchanged). `entities/member/index.ts` re-exports `useMembers`, `memberSchema`, `Member`, `memberKeys`. `pages/classification-detail` imports from `@/entities/member` afterward; its existing tests move with the files and are otherwise untouched. This is the first preparatory commit (docs-only addition: `docs/architecture.md`'s slice map gains `member` under entities, matching the existing "Slice map (create on demand)" convention).
- **`entities/review-rule` (new)**: `model/reviewRules.schema.ts` matching `docs/api-contract.md`'s `ReviewRules` interface exactly (`highlightAbove`, `requireReviewBelow`, `requireClarifyingQuestion`, `requireOverrideReason`, `secondApproverChapters: string[]`, `auditRetention`). `api/reviewRules.keys.ts`, `api/reviewRules.query.ts` (`useReviewRules()` → `GET /review-rules`). Batch review's "Approve high-confidence" default-90 fallback (see `docs/pages/batch.md`) reads this same query, which is why it is an entity and not page-local.
- **Workspace name / default jurisdiction**: no `entities/workspace` this task (SG-2 decided - one page needs it, and `docs/api-contract.md` has no workspace-settings endpoint yet). `pages/settings/api/workspaceSettings.query.ts` and `.mutation.ts` are page-local, hitting a new contract addition (see below). If a second page needs workspace settings later, promote to `entities/workspace` then, per `docs/architecture.md` rule 7.

### Contract addition needed

`docs/api-contract.md` has no endpoint for workspace name/default jurisdiction. SG-3 (open question) proposes `GET /workspace` / `PATCH /workspace` returning `{ id, name, defaultJurisdiction }`; update the contract doc before building, per CLAUDE.md §6's "contract changes: update docs/api-contract.md first."

### Queries

- `useWorkspaceSettings()` → `GET /workspace` (new, pending SG-3).
- `useMembers()` → `GET /members` (existing, moved).
- `useReviewRules()` → `GET /review-rules` (new).

### Mutations (page-local, `pages/settings/api`, single consumer each - no feature slice needed per `docs/architecture.md` rule 7)

- `useUpdateWorkspaceSettings()` → `PATCH /workspace`. On success, calls `useSetSession()` to update `session.workspaceName` (per the approved decision) and invalidates the workspace-settings key.
- `useUpdateAccount()` → reuses `PATCH /me` if it exists, else is part of the same SG-3 contract addition as `{ name }`; on success calls `useSetSession()` to update `session.name`. (Open question SG-4: confirm `/me` supports `PATCH`, or add it alongside the GET already in the contract.)
- `useSignOut()` - reused as-is from `entities/session` (built in the Home task); Settings composes it the same way `widgets/app-shell` does (`setSession(null)` then `navigate(routes.landing)`).
- `useInviteMember()`, `useUpdateMemberRole()`, `useRemoveMember()` → `POST /members/invite`, `PATCH /members/:id`, `DELETE /members/:id`. Each invalidates `memberKeys.list()`.
- `useUpdateReviewRules()` → `PUT /review-rules`. Invalidates `reviewRulesKeys.detail()`.

### MSW

- `src/app/mocks/handlers/members.handlers.ts`: one in-memory store (module-level array, reset per test setup) shared by `GET /members`, `POST /members/invite`, `PATCH /members/:id`, `DELETE /members/:id` - so Settings' own writes are visible on refetch without a page reload, and the store also backs the existing `GET /members` consumer in `classification-detail`. Enforce server-side: reject (422) removing/demoting the last admin or removing yourself, matching `docs/api-contract.md`'s business rule.
- `src/app/mocks/handlers/reviewRules.handlers.ts`: `GET`/`PUT /review-rules`, single in-memory record.
- `src/app/mocks/handlers/workspace.handlers.ts` (new, pending SG-3): `GET`/`PATCH /workspace`.
- Fixtures: three members ported from the export's Alex/Mina/Jordan (translated to the real `Member` shape - `id`, `lastActiveAt` as real relative-computed timestamps rather than the export's literal "Now"/"2 hours ago"/"Yesterday" strings), one review-rules record matching the export's defaults (90/80/true/true/false/["30","84","85"]), one workspace record (`{ name: "Northwind Imports", defaultJurisdiction: "US_HTS" }`).
- Latency 300-700 ms; `forceError`/`forceDelay` on every new handler, per the existing scenario mechanism.

## States

- **Loading** (each tab's own query): `Skeleton` matching that tab's card layout; the nav renders immediately (it needs no data).
- **Empty**: not applicable to General/Rules (always exactly one record). Members: not expected to be empty (the signed-in user is always a member), so no empty state designed; if the list is ever empty, `EmptyState` "No members yet" with "Invite member" is the fallback.
- **Error**: `ErrorState` "We couldn't load settings" with "Try again" (`refetch()`), scoped to the failing tab's card only - the nav and other tabs stay usable.
- **Partial**: not applicable (each tab is one query).
- **Permission**: SG-5 (open question) - DEFAULT is that Members and Review rules render a dismissible `Banner` "Only admins can manage members."/"Only admins can change review rules." for non-admins and disable every control on that tab (read-only), rather than hiding the tab or 403'ing; General and Account stay editable for everyone (a non-admin can still change their own display name and sign out). Mock session's role is reused from `entities/session` if a `role` field exists there already, else this task adds one (see SG-5).
- **Dirty-state (Review rules, SR-1)**: Save/Discard both disabled until the form differs from the last-fetched server values; Save is disabled while the mutation is pending; a successful save re-baselines the "clean" comparison to the new values.

## Interactions

- Nav links: real `NavLink`s to the three routes; `aria-current="page"` on the active one; each tab is its own lazy-loaded route component (`pages/settings/ui/{GeneralTab,MembersTab,RulesTab}.tsx`), not a client `useState("general")` switch as in the export (Shortcut 5).
- General Save: `useUpdateWorkspaceSettings()`; on success, toast "Settings saved" and `useSetSession()` updates `session.workspaceName` so the topbar's static workspace label (set up in the Home task) reflects it without a reload.
- Account Save (display name): same pattern, `session.name` updates; the greeting on Home picks it up next render since it reads from the shared session context.
- Sign out: identical composed handler to `widgets/app-shell`'s (clear session, `POST /auth/sign-out`, navigate to `/`) - not a second implementation.
- Members - Invite: opens `Modal`; submit validates email format and required role client-side, then `useInviteMember()`; success closes the modal, toast "Invitation sent", new row appears with `status: invited`.
- Members - Role select: inline `Select` onChange calls `useUpdateMemberRole()` immediately (no separate Save - matches the export's direct `<select onChange>`); disabled with a `title` tooltip for the current user's own row and for the sole remaining admin's row, mirroring the export's two disablement rules; a failed server-side rejection (e.g. a race where two tabs demote the last two admins) shows an inline/toast error and reverts the select.
- Members - row menu: "Resend invite" only on `invited` rows, posts (reuses invite endpoint or a dedicated resend - SG-6 open question) and toasts "Invitation sent again"; "Remove" opens the confirm `Modal`, disabled (same tooltip rules) for self/last-admin; confirming calls `useRemoveMember()` and shows a toast with Undo (SG-7 open question: whether Undo re-invites or just restores the row optimistically before the real request - see below).
- Review rules - Toggles: controlled (`checked`/`onChange` into local form state), replacing the export's uncontrolled `defaultChecked` (Shortcut: uncontrolled toggles, listed in the task prompt). Threshold inputs validate as numbers 0-100 inline (error text below the field, per `design.md`'s input spec) before Save is enabled. The second-approver toggle off disables (not hides) the chapters fieldset.
- Review rules - Save: `useUpdateReviewRules()`; success re-baselines the dirty check and toasts "Review rules saved". Discard resets the form to the last-fetched values (no toast, no request).
- Document title per tab: "Settings · General" / "Settings · Members" / "Settings · Review rules" via `useDocumentTitle`.

## Responsive behavior

- `<=1000px`: settings grid collapses to one column - nav above content, same pattern as Methodology's/Home's grid collapse at `$bp-tablet`.
- `<=720px`: members table scrolls horizontally inside its `Card` (design.md §8); the two threshold inputs in Review rules stack to one column; invite/remove modals already go full-width-capable per the `Modal` spec; nav links wrap if needed, each keeping a 40px touch target.

## Prototype corrections that apply here

- **Hardcoded member timestamps** ("Now", "2 hours ago", "Yesterday", lines 2502-2517): replaced with real `lastActiveAt` ISO timestamps rendered through the existing `formatDate`/`Intl` helper, not literal strings.
- **Uncontrolled `Toggle`s** (`defaultChecked`, line 2471-2487): the brief's `Toggle` usage is fully controlled (`checked` + `onChange`), per the task's explicit correction.
- **"Reset to defaults" that just remounts the form with a new `key`** (lines 2762-2768, `rulesKey`): replaced with a real Discard that reverts to the last-saved server values, not a factory-default reset with no backing data.
- **Client-only admin/self rules** (lines 2605-2614, 2665-2675): the UI still disables the control for immediate feedback, but the mock server also enforces both rules (422) so a race between two sessions can't leave zero admins - the export has no server to violate.
- **No `window.alert`/`confirm`**: none in the export; invite/remove already route through `Modal`, matching CLAUDE.md §10 - nothing to change here.
- **Settings reached only via in-memory tab state, no distinct URL** (Shortcut 5 pattern applied to this screen specifically, even though the make-export-index's Shortcut 5 write-up is about the global `screen` router): the three tabs become three real routes as decided, so deep-linking and Back/Forward work per-tab.
- **Export's extra General fields** ("Default reviewer", "Time zone") have no corresponding contract fields; cut rather than inventing contract support for them (see Prototype corrections note under General tab).
- **Members-table keyboard accessibility** (Shortcut 6, same defects as `ProductTable`/`PortalMenu`): the row menu here reuses the already-fixed `Menu` component (portal, `role="menu"`/`menuitem`, arrow keys, Esc, focus return), so this page inherits the fix rather than re-implementing it.

## Decisions (resolved; supersede the "DEFAULT" proposals below where they differ)

- **SG-1, SG-2, SG-3, SG-4, SG-8**: accepted as proposed below.
- **SG-5**: `entities/session`'s schema/fixture gained an optional `role` (`admin | reviewer | analyst`), mirroring the signed-in user's own membership row (`MOCK_SESSION`/`buildSessionFixture` both set `"admin"`). Members and Review rules render a dismissible `Banner` plus disable every control on the tab for non-admins. This is UI-only enforcement - `docs/api-contract.md` now notes that the real backend must enforce it server-side too, since a client can't be trusted to self-restrict.
- **SG-6**: "Resend invite" reuses `POST /members/invite`. The mock handler is idempotent: inviting an email that already belongs to a member returns that member unchanged (200) instead of creating a duplicate, so the same call backs both the first invite and every later resend.
- **SG-7 CHANGED**: removing a member uses a confirm `Modal` and a `Toast`, with **no Undo** - unlike Home/Library's delete-with-Undo pattern. The rules are enforced both client-side (disabled control with a tooltip) and server-side (422): you can't remove yourself or the last admin, and you can't demote the last admin. Review rules stay page-local in `pages/settings/{model,api}` - no `entities/review-rule` yet; a future Batch-review task that needs the same data promotes it then. The members query was promoted into `entities/member` in the same change as the Members tab, giving the slice two consumers (Settings' Members tab and classification-detail's "Assign to" select); classification-detail's existing tests pass unchanged against the new import path. Mutations (invite, role change, remove, workspace, account, review rules) stay page-local per `docs/architecture.md` rule 7 - Settings is their only consumer.

## Open questions for me (as proposed; see Decisions above for what was actually accepted)

- **SG-1**: Account section placement and scope - DEFAULT: a third card on the General tab (display name + read-only email + Sign out), as written above, rather than a fourth tab or a topbar-only control.
- **SG-2**: Workspace name/jurisdiction stay page-local (`pages/settings/api`) rather than a new `entities/workspace` slice, since Settings is still the only consumer. DEFAULT: page-local, promote later if a second consumer appears (e.g. an onboarding page).
- **SG-3**: `docs/api-contract.md` needs a workspace-settings endpoint; none exists today. DEFAULT: add `GET /workspace` / `PATCH /workspace` → `{ id, name, defaultJurisdiction }`, written into the contract doc before the entity/mutation exists, per workflow.
- **SG-4**: Account display-name save needs a `PATCH /me` (or equivalent) that isn't in the contract today (`GET /me` exists, no write). DEFAULT: add `PATCH /me` accepting `{ name }`, alongside SG-3's workspace addition.
- **SG-5**: Role-gating Members/Review rules for non-admins needs the mock session to carry a `role`. DEFAULT: add `role: Member["role"]` to `entities/session`'s schema/fixture (mirroring the signed-in user's own membership row) and gate both tabs with the `Banner` + disabled-controls pattern described in States, rather than hiding the tabs or blocking the route.
- **SG-6**: "Resend invite" has no explicit contract endpoint. DEFAULT: reuse `POST /members/invite` with the same email (idempotent re-send on the mock), rather than adding a new endpoint for one menu item.
- **SG-7**: Remove-member Undo - the export restores the removed row locally and re-adds it to its in-memory array on Undo, with no real request semantics to undo. DEFAULT: match the Home/Library delete-with-Undo pattern exactly - remove the row optimistically, defer the real `DELETE /members/:id` until the toast's dismiss timer elapses, and cancel it (restoring the row, no request sent) if Undo is clicked - rather than a "remove then re-invite" round trip.
- **SG-8**: Whether `secondApproverChapters` needs real HS-chapter names/data beyond the five the export hardcodes (30/61/84/85/87). DEFAULT: keep exactly those five as the full option list for now (no chapter-lookup entity); revisit if a future page needs the full HS chapter list.

## Deviations from this brief found during implementation

- **DataTable's `rowHref` is now optional.** The brief assumed `DataTable` as already built, but that component required `rowHref` (first column always a `Link`). Members' rows have no detail page, so `rowHref` is now optional - omitted, the first column renders as a plain cell. Confirmed with the approving user as a required, additive, backward-compatible change (ClassificationTable's existing usage is unaffected); `DataTable` also gained an optional `caption` (visually-hidden) and `Menu`'s `MenuItemConfig` gained optional `disabled`/`title`, both additive, used by the Members row menu's disabled "Remove" state.
- **Member status dot-plus-label** is page-local markup (not the shared `StatusIndicator`, whose `status` union is classification-specific), matching the Decisions note under Components already in this brief.
- **Second-approver toggle** has no dedicated contract field - it's derived from whether `secondApproverChapters` is non-empty, since the `ReviewRules` contract type has no separate boolean for it.

## Acceptance criteria (testable)

- [ ] Three routes (`/app/settings/general`, `/members`, `/rules`) each render via a lazy page-local layout + tab component; `NavLink`s carry `aria-current="page"`; Back/Forward and reload work per-tab.
- [ ] `entities/member` exists (schema, keys, `useMembers`) with `pages/classification-detail`'s existing tests passing unchanged against the new import path; `docs/architecture.md`'s slice map lists `member`.
- [ ] `entities/review-rule` exists (schema matching `docs/api-contract.md`'s `ReviewRules` exactly, keys, `useReviewRules`).
- [ ] General: Save persists workspace name + jurisdiction and updates `session.workspaceName` via `useSetSession`; Account: Save persists display name and updates `session.name`; Sign out clears the session and navigates to `/`.
- [ ] Members: invite (validated email + role), inline role change (blocked for self and sole admin, both client- and server-enforced), remove (confirm modal, Undo-timed delete, blocked for self/sole admin).
- [ ] Review rules: both thresholds validate 0-100; three `Toggle`s are fully controlled; Save/Discard disabled while clean or pending; Save shows a success toast; Discard reverts to last-saved values (not a hardcoded factory default).
- [ ] Loading uses `Skeleton` per tab; load errors use `ErrorState` with working "Try again", scoped to the failing tab.
- [ ] No raw colors/off-scale spacing; no new shared/ui component added (none needed); no `Tabs` component used for the settings nav.
- [ ] Responsive at 375/768/1280: grid collapses to one column at `<=1000px`; members table scrolls inside its card at `<=720px`.
- [ ] `npm run check` passes.
