# Page brief: Home

Status: approved
Route: `/app` | FSD slice: `pages/home`, plus `widgets/app-shell` (new), `entities/classification` (new)

This brief bundles four ordered sub-tasks, per instruction. They must land in this order because each is a dependency of the next:

1. `/health` check (TanStack Query) + waking screen + error screen with real retry + MSW scenarios.
2. Sign-out in `entities/session`, plus the session's new optional `name`/`workspaceName` fields.
3. `widgets/app-shell` (sidebar, topbar, mobile drawer), mounted as a layout route - gated by the health check from (1), using sign-out from (2).
4. The Home page itself and its data (`entities/classification`, zod schemas, MSW handlers).

## Design reference

- Figma URL / node: https://www.figma.com/make/v8wpvjs0lOovob7BIzYKzu/HS-Copilot-Classification-Workspace (fileKey `v8wpvjs0lOovob7BIzYKzu`, node `0:1`) - Make file, source-only (no rendered screenshot from MCP).
- Screenshots: `design/screens/home.png`, `home.mobile.png`. No tablet screenshot exists for this screen; decided (see below) to keep the sidebar persistent down to 720px, matching design.md §4/§7 literally, so nothing tablet-specific needs inventing.
- Make source (via `docs/make-export-index.md`): `HomeScreen` (1332-1444), `AppShell` (1103-1330), `SideNavigation` (1058-1101), `ProductTable` (428-601), `PortalMenu` (392-426), `StatusChip` (299-312), `Confidence` (314-323), `products` seed data (108-235), `Screen`/`go()` navigation (3017-3029, read for the cold-start timer this task replaces), reject modal (1981-2015, read to resolve the reason-requirement question below).
- Colors and button styles are taken from `design.md`, not the export.

## Purpose and user goal

The signed-in reviewer's landing screen: see what needs attention, start a one-off classification, and see recent activity - the hub `widgets/app-shell` wraps for every `/app/*` page from here on.

---

## Task 1 - `/health` check, waking screen, error screen

### Why here, not inside the page

The cold-start gate protects the whole authenticated app, not just Home, so it lives in `widgets/app-shell`, not `pages/home`. `GET /health` already has a handler (`src/app/mocks/handlers/health.handlers.ts`, wired into `server.ts`); nothing in the entity/query layer calls it yet.

### Decided behavior

- `useHealthCheck()`, **widget-local**: `widgets/app-shell/api/health.query.ts` (not an entity - one consumer, not a domain object; same reasoning as `StaticPage`). Query key `["health"]`, `queryFn` calls `http.get("/health", { signal: AbortSignal.timeout(60_000) })` (60s per-attempt timeout), parsed with `z.object({ status: z.literal("ok") })`. `staleTime: Infinity` (checked once per session). `retry: 3` with the client's default backoff - a failed attempt retries automatically; only once retries are exhausted does the query settle into `isError`.
- **Waking screen appears only after ~800ms**, not immediately: a local `useState`/`setTimeout` flips a `showWaking` flag true at 800ms, and `WakingScreen` renders only when `isPending && showWaking`. This avoids a flash of the cold-start screen on a fast, healthy response. While retries are in flight the query is still `isPending`, so `WakingScreen` (not `ErrorScreen`) stays up through every retry - `ErrorScreen` only appears once `isError` is true, i.e. after all 3 retries have failed.
- `ErrorScreen`'s "Try again" calls the query's `refetch()` - a real request, not a state flip back to "home" like the export (Shortcut 4).
- Both screens are **widget-local** (`widgets/app-shell/ui/WakingScreen.tsx`, `ErrorScreen.tsx`) - same single-consumer reasoning as `StaticPage`; promote to `shared/ui` if a second full-page consumer appears later.
- **New MSW scenario**: `forceDelay` alongside the existing `forceError` mechanism in `scenarios.ts` - `?forceDelay=<ms>` holds a handler's response for that long before resolving, so the 800ms-threshold behavior and the retry/timeout path are both actually testable (`forceError` alone can't simulate "slow, not failed"). Applies to any handler that opts in, not just `/health`.
- **Testing approach**: widget tests for `AppShell`'s waking/error/success states use `vi.mock` of `useHealthCheck` (returning the three TanStack Query result shapes directly) rather than driving real timers through MSW - same precedent as `AuthForm.error.test.tsx` from the Auth task. A smaller, separate integration test can still exercise the real MSW `forceDelay`/`forceError` path end-to-end if useful, but the widget's own state-rendering tests don't need to wait on real timers.

## Task 2 - Sign-out, and session additions

> **Amended 2026-11-18:** sign-out now calls a real `POST /auth/sign-out` (204) and clears the TanStack Query cache, superseding the "pure state, no endpoint" decision below. The local session is still cleared first and a failed request is not surfaced to the user - a real cookie-backed session could still be live server-side after a failed sign-out call; show a toast when `Toast` exists to surface that case instead of swallowing it silently forever.

- **Contract first**: `docs/api-contract.md`'s `Session` interface gets two new optional fields, `name?: string` and `workspaceName?: string`. `entities/session`'s `sessionSchema` and `MOCK_SESSION` fixture follow.
- Greeting is **by local hour**, independent of whether a name exists: "Good morning"/"Good afternoon"/"Good evening" from `new Date().getHours()`. If `session.name` is present, append ", {name}."; if absent, the greeting stands alone with a period - **no name is ever derived from the email.**
- `entities/session/model/useSignOut.ts`: `useSignOut(): () => void`, calling `useSetSession()` to set the session to `null`. Pure state, no endpoint - `docs/api-contract.md` has no `/auth/sign-out`, matching the in-memory-only session decision from the Auth task.
- `widgets/app-shell` composes `useSignOut()` + `useNavigate()` itself (`setSession(null)` then `navigate(routes.landing)`) - navigation isn't baked into the hook.
- Both sign-out entry points (sidebar bottom link, topbar account-menu item) call the same composed handler.

## Task 3 - `widgets/app-shell`

### Mounting: a layout route, lazy-loaded

`AppShellLayout` is registered in `app/router/router.tsx` as a layout route (renders `<Outlet />`), nested inside the existing `RequireSession` wrapper:

```
{ Component: RequireSession, children: [
  { Component: AppShellLayout, children: [
    { path: routes.home, Component: HomePage },
    ...all other /app/* routes,
  ] },
] }
```

`AppShellLayout` itself is `lazy(() => import(...))`, same pattern as every page - it, and the `Modal`/`Menu` components (and therefore Radix) it pulls in, only load once a signed-in user actually reaches `/app/*`, never in the public/marketing bundle.

### Layout (from `AppShell`/`SideNavigation`, 1058-1330)

- **Sidebar** (240px, fixed, persistent down to 720px - decided, see Responsive behavior): logo (→ `/app`), nav list - Workspace (`/app`), New classification (`/app/classify/new`), **Batch review → `/app/batches/new`** (decided: the only existing static batch route; there's no batch-list page yet, so the sidebar entry points at the batch-upload entry point rather than a route needing an id that doesn't exist), Library (`/app/library`); bottom: Settings & team (`/app/settings/general`), Sign out.
- **Mobile drawer**: same `SideNavigation`, opened from a hamburger in the topbar, closes on outside click/Esc/nav, focus returns to the hamburger on close (same pattern as `widgets/public-shell`'s `MobileMenu`).
- **Topbar** (64px, sticky): hamburger (mobile only) · workspace label · spacer · Help menu · Account menu.
  - **Workspace label**: static text from `session.workspaceName` - not an interactive switcher. No `entities/workspace`, no "Create workspace"/"Workspace settings" items this task.
  - **Help menu** (popover, `role="menu"`): "How classification works" (→ `/methodology`), "Contact support" (`mailto:`), "Report an incorrect result" (`mailto:`), footer note "Suggestions are not legal advice."
  - **Account menu** (popover, `role="menu"`): `session.email`, "Account settings" (→ `/app/settings/general`), "Sign out".
- Dropped entirely (not ported): keyboard-shortcuts modal, the global `N`/`/` shortcuts - see Prototype corrections.

### New shared/ui this task adds

| Component                 | Why Home needs it now                                                                                                                                                    | design.md spec  |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------- |
| `Modal`                   | `DataTable`'s delete-confirm dialog.                                                                                                                                     | §5 Modal        |
| `Menu`/`Popover`          | Topbar Help/Account menus, and `DataTable`'s row-action menu. One primitive, two call sites.                                                                             | §5 Popover/Menu |
| `DataTable`               | Both of Home's tables need row-keyboard-operability + a row-action menu; building one generic table now avoids rebuilding the same logic for Library/Batch review later. | §5 DataTable    |
| `Toast` (provider + hook) | Row actions (approve, copy code, delete+undo) all give toast feedback.                                                                                                   | §5 Toast        |

**Can wait** for Library/Batch review/Settings: `Tabs` (Settings nav only), `Pagination` (Home's lists are small, fixed, unpaginated), `FilterDropdown` (no filters on Home).

### Radix - approved, scope and versions

Approved for `Modal` (`@radix-ui/react-dialog`) and `Menu`/`Popover` (`@radix-ui/react-dropdown-menu`) **only**, used exclusively inside their `shared/ui` wrappers - nothing elsewhere imports Radix directly.

Checked via `npm view <pkg> version time --json` (full version/time history, not just the latest dist-tag) for the newest stable (no `-rc`) release at least 14 days old as of 2026-11-13, and `npm view <pkg>@<version> peerDependencies --json` for React compatibility:

| Package                         | Exact version to pin | Published                          | Next version after it                       | React peer range                                         | Compatible with our `react@^19.3.1`? |
| ------------------------------- | -------------------- | ---------------------------------- | ------------------------------------------- | -------------------------------------------------------- | ------------------------------------ |
| `@radix-ui/react-dialog`        | `1.3.1`              | 2026-10-12T21:03:50Z (32 days old) | `1.3.2-rc...` (prerelease only, 2026-10-13) | `^16.8 \|\| ^17.0 \|\| ^18.0 \|\| ^19.0 \|\| ^19.0.0-rc` | Yes                                  |
| `@radix-ui/react-dropdown-menu` | `2.2.1`              | 2026-10-12T21:02:48Z (32 days old) | `2.2.2-rc...` (prerelease only, 2026-10-13) | `^16.8 \|\| ^17.0 \|\| ^18.0 \|\| ^19.0 \|\| ^19.0.0-rc` | Yes                                  |

Both packages' most recent release of any kind after the pinned version is a `-rc` prerelease (`1.3.2-rc.*`, `2.2.2-rc.*`) - there is no newer stable release being skipped over. This is the list to review before anything is installed - nothing has been installed yet; `/new-page home` will pin exactly these two versions when implementation starts, pending your go-ahead on this list specifically.

---

## Task 4 - Home page and its data

### `entities/classification` (new)

- `model/classification.schema.ts` - zod schema matching the **full** `Classification`/`Candidate`/`Evidence`/`AuditEntry` shapes in `docs/api-contract.md` (not just the fields Home renders) - future pages (`classification-detail`, `library`, `batch-review`) consume the same entity, so the contract is the schema now rather than widening it per-page later. `Status` as `z.enum(["approved", "rejected", "needs_review", "pending"])`.
- `api/classifications.keys.ts` - key factory, e.g. `classificationKeys.list(params)`.
- `api/classifications.query.ts` - `useClassifications(params)` → `GET /classifications`, parsed as `{ items, total, page, pageSize }`. Home calls this **once** (sorted by `updatedAt` desc, a reasonable `pageSize`) and derives both of its lists client-side:
  - **Review queue** = items where `status` is `needs_review` or `pending`.
  - **Recent classifications** = the same list, first 8.
    This keeps "N need attention" genuinely derived from data (Shortcut 2), not a separate hardcoded count, and avoids a second round-trip.
- `ui/ClassificationStatusBadge.tsx` - domain wrapper around shared `Badge`, mapping contract `needs_review` (snake_case) to `Badge`'s `needs-review` (kebab) status prop.
- Mock data: the 14 seed records are ported verbatim from the export's `products` array (108-235) - same descriptions, HS codes, confidences, statuses - translated into the full contract shape (citations → `evidence`, `reasoning` → candidate reasoning, `ruling`/`rulingRef` → a ruling-kind `Evidence` entry, `alternatives` → two extra `Candidate` entries). This seeds `classification-detail` later with internally-consistent data instead of redoing it then.
- MSW: `src/app/mocks/handlers/classifications.handlers.ts` - `GET /classifications` (honors `status` as comma-separated, per the `api-contract.md` clarification added this round, plus `sort`/`page`/`pageSize`), latency + `forceError` + `forceDelay` scenarios. `POST /classifications/:id/decision` (approve) and `DELETE /classifications/:id` (see Delete/Undo below).

### Mutations live in `pages/home/api`

No exception to architecture rule 7 this round: approve/delete mutations are page-local (`pages/home/api`) until a second consumer (Library, Batch review) actually exists, same as every other page so far. Move them down into a feature when that happens.

### Layout (from `HomeScreen`, 1332-1444)

1. `PageHeader`: title is the local-hour greeting, with `, {session.name}` appended only when `session.name` exists (see Task 2). Description: "`{n}` classification is/are waiting for your review." (singular/plural), action = primary Button "New classification" (icon `Plus`) → `/app/classify/new`.
2. Two-column grid (7/5 split like Methodology, collapsing to one column at `$bp-mobile`):
   - **Review queue card**: eyebrow "Review queue", `h2` "`{n}` need attention", "Review all →" → **`/app/library?status=needs_review,pending`** (decided: points at a page that's actually data-backed this task, instead of a batch screen that doesn't exist yet), then a list of attention rows (name + code, `Meter`, `ClassificationStatusBadge`, arrow) - each row opens `/app/classifications/:id`.
   - **Quick-add card**: eyebrow "Quick add", `h2` "Classify one product", helper copy, a `TextInput` with `aria-label="Product description"` (the export shows no visible label, only a placeholder, which isn't a real label - CLAUDE.md §7 requires one), placeholder "e.g. Stainless steel vacuum bottle…", Button "Classify" (icon `ArrowRight`) → navigates to **`/app/classify/new?q=<encoded text>`** (a real URL query param, not router state, so the destination is linkable/shareable even though `classify-new` itself is out of scope here).
3. Section heading "Latest activity" / "Recent classifications", "View library →" → `/app/library`.
4. `DataTable` (compact density, no checkbox column, no "Updated" column - matches the screenshot), needs-review rows get the amber-tint row background (design.md DataTable spec). The product-name cell renders a **real `Link`** to `/app/classifications/:id` (not a row-level click/keydown shim) - this is the row's actual accessible navigation target; clicking elsewhere in the row (not the action cell) is a mouse convenience that follows the same href.
5. **Batch-mini footer - cut.** No `entities/batch` this task; porting the export's footer would mean hardcoding "`X` of `X`" again (Shortcut 2), which is exactly what's being fixed elsewhere on this page. Revisit once Batch review/Upload exist.

## Exact copy

- Description: "`{n}` classification is waiting for your review." / "`{n}` classifications are waiting for your review." (singular when `n === 1`).
- Review queue heading: "`{n}` need attention."
- "Review all", "Quick add", "Classify one product", "Start with a plain-language product description.", placeholder "e.g. Stainless steel vacuum bottle…", "Classify".
- "Latest activity", "Recent classifications", "View library".
- Row-menu items: "Open", "Approve", "Copy code", "Delete" - **not** "Override code", "Reject", or "Re-run research" (all three dropped, see Prototype corrections).
- Toasts: "Classification approved", "HS code copied", "Classification deleted" (with Undo).
- Delete confirm modal: title "Delete classification?", body `This removes "{product}" from the workspace.`, Cancel / Delete.
- Waking screen: "Server waking up", "Preparing your workspace. This usually takes less than a minute."
- Error screen: "We couldn't load this workspace", "Your work is safe. Clear the temporary error and try loading the demo again.", "Try again".

## Components

| Element                                | Component                                   | Existing / New                                   |
| -------------------------------------- | ------------------------------------------- | ------------------------------------------------ |
| Page header                            | `PageHeader`                                | Existing                                         |
| Review queue / quick-add cards         | `Card`                                      | Existing                                         |
| Confidence meter                       | `Meter`                                     | Existing                                         |
| Status                                 | `ClassificationStatusBadge` (wraps `Badge`) | New, entity-local (`entities/classification/ui`) |
| Quick-add field                        | `TextInput`                                 | Existing                                         |
| Buttons                                | `Button`                                    | Existing                                         |
| Sidebar / topbar / mobile drawer       | `widgets/app-shell`                         | New, lazy-loaded layout route                    |
| Help/account popovers, row-action menu | `Menu`/`Popover`                            | New shared/ui (Radix - approved, see Task 3)     |
| Delete-confirm dialog                  | `Modal`                                     | New shared/ui (Radix - approved, see Task 3)     |
| Recent/review tables                   | `DataTable`                                 | New shared/ui                                    |
| Action feedback                        | `Toast` (provider + hook)                   | New shared/ui                                    |
| Waking / error full-page states        | `WakingScreen` / `ErrorScreen`              | New, widget-local (`widgets/app-shell/ui`)       |

No `Tabs`, `Pagination`, or `FilterDropdown` this task.

## Data

- `entities/classification`: schema, keys, `useClassifications` query. MSW handlers + 14 ported fixture records.
- `pages/home/api`: `useApproveClassification`, `useDeleteClassification` mutations (page-local - see Task 4 note above). No reject mutation this task (see Prototype corrections).
- No `entities/batch` or `entities/workspace` this task.

## States

- **Loading** (classifications query pending): skeleton rows matching the final table/card layout (existing `Skeleton` component).
- **Empty** (zero classifications - a fresh workspace): review-queue card shows existing `EmptyState` ("No classifications yet", action "New classification"); recent-classifications table area shows the same pattern instead of an empty table.
- **Error** (classifications query failed): error card, "Try again" (`refetch()`) - a normal in-page error state, distinct from Task 1's whole-app cold-start/error screens, which only gate the very first load.
- The health-check waking/error states (Task 1) are handled once, above the whole shell, not per-page.

## Interactions

- Sidebar/topbar nav → real routes (`react-router` `Link`/`navigate`), never state-only (Shortcut 5).
- Product-name `Link` is the row's real navigation target (see Layout above); row-action button and any future checkbox remain independently tabbable (Shortcut 6).
- Row action button: `aria-haspopup="menu"`, `aria-expanded`; opening moves focus to the first menu item; `ArrowUp`/`ArrowDown` move between items; `Esc`/outside click closes and returns focus to the trigger (Shortcut 6 - all missing in the export).
- Approve: immediate mutation + toast "Classification approved", no confirm modal (not in CLAUDE.md §10's named destructive-confirm list).
- **Delete + Undo**: confirming the `Modal` immediately removes the row from the local list (optimistic) and shows a toast with an Undo action. The real `DELETE /classifications/:id` call is **deferred** until the toast's own dismiss timer elapses - if Undo is clicked first, the pending call is cancelled and the row is restored, and no request is ever sent. If the window elapses without Undo, the deferred call fires then. This keeps "Undo" meaningful (nothing is actually gone until the window closes) and never sends a request that then has to be reversed.
- Copy code: `navigator.clipboard.writeText`, toast feedback, no network call.
- Quick-add Classify: navigates to `/app/classify/new?q=<encoded text>`; does not create anything itself (classify-new's own task owns that mutation).

## Responsive behavior

- **Decided**: sidebar stays persistent down to 720px (single breakpoint, matching design.md §4/§7 literally and the export's own lack of a tablet-specific rule) - collapses to the mobile drawer only at `$bp-mobile`.
- Content grid (review-queue/quick-add) collapses to one column at `$bp-mobile`, same as Methodology's `methodGrid`.
- Table: horizontal scroll inside its card below `$bp-mobile`, per design.md §7.

## Prototype corrections that apply here

- **Shortcut 2** (hardcoded counts): "`{n}` need attention" and the description count are both derived from the fetched list, never hardcoded. The batch-mini footer's "`X` of `X` products classified" (always 100% by construction) is cut rather than ported broken.
- **Shortcut 3** (override/reject conflation): "Override code" is **dropped** from the row menu - in the export it's a no-op identical to "Open" (line 460), and the real override flow doesn't exist until `classification-detail` is built. Re-add it, wired to a real inline override, when that page exists.
- **Reject, checked against the export**: the export's dedicated Reject modal (1981-2015) _does_ ask for a reason (a "Reason (optional)" textarea, defaulting to a canned string when left blank if submitted). A one-click, reason-less row-menu "Reject" would skip that entirely. Decided: **"Reject" is dropped from the row menu this task**, for the same reason "Override code" is - the real reject-with-reason flow belongs to `classification-detail`, not a dense row menu. Re-add it there, with the reason field, when that page is built.
- **Re-run research - dropped**, along with its toast: no contract endpoint exists for restarting an agent run on an already-classified item, and a toast-only action that looks like it did something but didn't is worse than not having the menu item. Add it back, wired to a real restart, once `classify-new`/agent-progress exists.
- **Shortcut 4** (waking/error triggers): replaced with a real `/health` query per Task 1, with a timeout, retries, and a delay threshold before showing the waking screen at all; both full-page components are ported as presentation, only their triggers change.
- **Shortcut 5** (state-based navigation): every `go(...)` call becomes a real route (`Link`/`navigate`).
- **Shortcut 6** (keyboard accessibility): the product-name cell is a real `Link` (native keyboard/screen-reader semantics, not a `tabIndex`/`keydown` shim on the row), the row-menu trigger gets `aria-haspopup`/`aria-expanded`, the portal menu gets `role="menu"`/`role="menuitem"`, arrow-key navigation and focus-return are added, Esc already worked and is kept.
- **Not in the index**: the export's keyboard-shortcuts modal binds global `N`/`/` listeners even on screens where they do nothing useful yet. Dropped entirely for this task - add back once there's a real search field and a reason to jump straight to New classification from anywhere.

## Acceptance criteria (testable)

- [ ] `useHealthCheck`: 60s per-attempt timeout, 3 retries, waking screen only after ~800ms of pending state (not immediately), error screen only after retries are exhausted, "Try again" calls a real `refetch()`. `forceDelay` and `forceError` MSW scenarios both exist and are exercised; widget-level state tests use `vi.mock` of the hook.
- [ ] Sign-out (sidebar and topbar) clears the session and navigates to `/`, from both entry points, with no stale session on next `/app` visit.
- [ ] `session.name`/`workspaceName` are optional; the greeting never falls back to an email-derived name; the workspace label shows `workspaceName` as static text, no switcher.
- [ ] `widgets/app-shell` is mounted as a lazy-loaded layout route under `RequireSession`; Radix (`react-dialog`, `react-dropdown-menu`) is pinned at the exact versions listed above and imported only inside `shared/ui` wrappers.
- [ ] Home's two lists are both derived from one `useClassifications()` call; the "N need attention" count and description pluralization match the fetched data, not a hardcoded number.
- [ ] `DataTable` rows navigate via a real `Link` on the product name; the row-action menu has `aria-haspopup`, `aria-expanded`, `role="menu"`/`menuitem`, arrow-key navigation, and returns focus to the trigger on close.
- [ ] Row menu contains exactly: Open, Approve, Copy code, Delete - no Override code, Reject, or Re-run research.
- [ ] Delete shows a confirm `Modal`; confirming removes the row optimistically and shows an Undo toast; the real `DELETE` request fires only after the toast window elapses, and never fires at all if Undo is clicked.
- [ ] "Review all" links to `/app/library?status=needs_review,pending`; sidebar "Batch review" links to `/app/batches/new`; no batch-mini footer.
- [ ] Quick-add field has `aria-label="Product description"`; Classify navigates to `/app/classify/new?q=...`.
- [ ] Mutations (`useApproveClassification`, `useDeleteClassification`) live in `pages/home/api`, not a new feature slice.
- [ ] Loading/empty/error states implemented for the classifications list, distinct from the whole-app waking/error screens.
- [ ] Sidebar persistent down to 720px; content grid collapses to one column at `$bp-mobile`; table scrolls horizontally below `$bp-mobile`.
- [ ] No raw colors/off-scale spacing; `docs/component-inventory.md` updated for every new shared/ui and widget component.
- [ ] `npm run check` passes.
- [ ] Responsive at 375/1280 against the two existing screenshots.
