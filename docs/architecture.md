# Architecture (Feature-Sliced Design)

## Layers

| Layer                                       | Purpose                                                               | May import from                     |
| ------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------- |
| `app`                                       | init: providers, router, layouts, global styles, MSW bootstrap, mocks | everything below                    |
| `pages`                                     | one slice per route; composes widgets, features, entities             | widgets, features, entities, shared |
| `widgets`                                   | large reusable UI blocks used by several pages                        | features, entities, shared          |
| `features`                                  | one user action with business value (approve, upload batch, sign in)  | entities, shared                    |
| `entities`                                  | domain objects (classification, batch, member...)                     | shared                              |
| `shared`                                    | domain-free: ui kit, http client, config, lib, styles                 | nothing                             |
| Not used: the deprecated `processes` layer. |

## Rules

1. Import only downward. Never sideways between slices of one layer (compose upward).
2. Cross-slice imports go through the slice `index.ts` using the `@/` alias. Inside a slice use relative imports.
3. Segments: `ui`, `model`, `api`, `lib`, `config`. `app` and `shared` contain segments only.
4. Reads (queries) live in `entities/*/api`. Writes (mutations) live in `features/*/api` and invalidate entity keys.
5. If two features need the same logic, move it down (entity or shared) or up (widget). If two entities reference each other, keep references by id; if truly needed use FSD `@x` cross-imports and record it in the decisions log.
6. Create slices on demand. Mocks are an `app`-layer concern and are never imported by UI.
7. Page-local mutations live in `pages/<slug>/api` until a second consumer exists, then move to a feature.

## Where does it go?

- Reusable, domain-free UI -> `shared/ui`. HTTP, env, route constants, hooks, formatters -> `shared/*`.
- A noun of the business (Classification, Batch, Member) with schema, queries, small UI -> `entities/<noun>`.
- A verb the user performs (approve, upload, invite) with its form/button/mutation -> `features/<verb>`.
- Session lifecycle (sign-in state, sign-out) lives in `entities/session`, not a feature, because both the auth pages and `widgets/app-shell` depend on it.
- A composed block reused on 2+ pages (app shell, classification table, audit drawer) -> `widgets/<name>`.
- Page-specific composition, layout and route-level data wiring -> `pages/<route>`.
- Router, providers, layouts, global styles, MSW -> `app`.

## Slice map (create on demand)

- entities: `classification`, `batch`, `agent-run`, `member` (built - promoted from `pages/classification-detail/api`), `workspace` (built - promoted from `pages/settings`: workspace and plan schemas, `useWorkspace`, `usePlans`), `session`, `review-rule`, `evaluation`
- features: `review-decision` (approve, reject, override, request-info, undo), `delete-classification` (delete with Undo grace window), `classify-product`, `answer-clarification`, `bulk-review`, `upload-batch`, `auth`, `manage-members`, `edit-review-rules`, `edit-workspace`, `filter-classifications`, `export-data`
- widgets: `app-shell` (sidebar, topbar, menus), `public-shell` (header, footer, mobile menu), `classification-table`, `audit-trail`, `agent-progress`, `evidence-drawer`, `expiring-banner` (built), `route-error` (built)
- pages: `landing`, `methodology`, `auth`, `legal`, `public-try`, `home`, `classify-new`, `classification-detail`, `batch-upload`, `batch-review`, `library`, `settings`, `not-found`, `kit` (dev only)

## Routes (`app/router`, paths in `shared/config/routes.ts`)

`/` landing | `/methodology` | `/pricing` | `/signin` | `/privacy` | `/terms` | `/try` | `/app` home | `/app/classify/new` | `/app/classifications/:id` | `/app/batches/new` | `/app/batches/:id` | `/app/library` | `/app/settings/{general|members|rules}` | `/_kit` (dev only) | `*` not found. Pages are lazy-loaded. `/app/*` is behind the session guard (mock session in mock mode).

## Errors and 404

- `appRoutes` in `app/router/router.tsx` has two error boundaries. The root one wraps every route and shows `RouteErrorScreen` full page (home = landing). A second one sits on a pathless route below `AppShellLayout`, so a page that throws (or whose lazy chunk fails to load) renders the error inside the shell's outlet and the sidebar and topbar stay (home = `/app`). A failure of the shell layout itself falls through to the root screen.
- `RouteErrorElement` (app) reads `useRouteError()` only to log it, and only when `import.meta.env.DEV`. `RouteErrorScreen` takes no error prop, so no message, stack or route params can reach the UI. It moves focus to its h1 on mount.
- 404: `/app/*` is the last child inside the in-shell boundary and renders `AppNotFoundScreen` inside the shell. Any other unknown URL hits the root `*` route, the public `NotFoundPage`. The `/app/*` path is deliberate: a bare `*` under a pathless parent would match public URLs too.
- `StatusScreen` (h1, description, actions) is the shared layout for the error screen, the in-app 404 and the public 404.

## Data flow

`page/widget/feature UI` -> `entities|features api hooks (TanStack Query)` -> `shared/api/http.ts` -> network.
In mock mode MSW intercepts the same request, so the code path is identical to production. Schemas (zod) in `entities/*/model` are the contract and parse every response.
Local UI state stays in components. Server state stays in TanStack Query. Session/workspace live in `entities/session` and `entities/workspace` (React context in `model`).

## Mock structure (`src/app/mocks`)

`browser.ts` (worker), `server.ts` (tests), `handlers/<entity>.handlers.ts`, `fixtures/<entity>.fixtures.ts`, `scenarios.ts` (latency, forced errors, throttling, cold start). Fixtures are typed with the entity types so drift fails typechecking.

## Env

`VITE_USE_MOCKS` (`true`/`false`), `VITE_API_BASE_URL`. Read only in `shared/config/env.ts`.

## Decisions log

- 2026-11: FSD + SCSS Modules + CSS variable tokens. MSW chosen over hand-written mock services so the real API can replace mocks without code changes.
- 2026-11 (batch task): `entities/batch` reuses `entities/classification`'s `Jurisdiction` and `ClassificationListResponse`/`ClassificationsListParams` types (a batch's rows are `Classification` records, per rule 5), via an FSD `@x` cross-import public API at `entities/classification/@x/batch.ts`, scoped to the `batch` slice only - not a general import of `entities/classification` from `entities/batch`.
- 2026-11 (pricing task): `entities/workspace` promoted from `pages/settings` (model: workspace and plan schemas; api: `workspaceKeys`, `useWorkspace`, new `usePlans`). Second consumer: the public Pricing page. The PATCH /workspace mutation stays in `pages/settings/api` (rule 7) and imports the entity's schema and keys. Renamed on the way: `WorkspaceSettings` -> `Workspace`, `useWorkspaceSettings` -> `useWorkspace`, `workspaceSettingsKeys` -> `workspaceKeys`.
- 2026-11 (pricing task): `entities/workspace`'s `Workspace` schema reuses `entities/classification`'s `jurisdictionSchema`/`Jurisdiction` (a workspace's default jurisdiction), via an FSD `@x` cross-import public API at `entities/classification/@x/workspace.ts`, scoped to the `workspace` slice only. No change to classification behavior.
- 2026-11 (expiry task): `widgets/expiring-banner` is a widget, not an entity UI component, because it needs both `useClassifications` (entities/classification) and `useWorkspace` (entities/workspace) and is used by two pages (Home, Library); entities cannot import each other and pages cannot import sideways.
- 2026-11 (try task): `DESCRIPTION_MAX_LENGTH` moved from `pages/classify-new/model` to `entities/classification/model` (exported from the slice index) so Landing, Try and Classify new can share it without a sideways page import. `classifyNew.schema.ts` re-exports it, so Classify new is unchanged.
- 2026-11 (errors task): new `widgets/route-error` holds `StatusScreen`, `RouteErrorScreen` and `AppNotFoundScreen`. It is a widget because the app-layer router and `pages/not-found` both need the layout, a page cannot import from `app`, and `shared/ui` must stay domain-free and unchanged (`ErrorState` renders an h3 with no heading ref, so it cannot serve as a page-level error screen). The router config is exported as `appRoutes` so tests can render it in a memory router.
