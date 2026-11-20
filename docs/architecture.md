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

- entities: `classification`, `batch`, `agent-run`, `member` (built - promoted from `pages/classification-detail/api`), `workspace`, `session`, `review-rules`, `evaluation`
- features: `review-decision` (approve, reject, override, request-info, undo), `delete-classification` (delete with Undo grace window), `classify-product`, `answer-clarification`, `bulk-review`, `upload-batch`, `auth`, `manage-members`, `edit-review-rules`, `edit-workspace`, `filter-classifications`, `export-data`
- widgets: `app-shell` (sidebar, topbar, menus), `public-shell` (header, footer, mobile menu), `classification-table`, `audit-trail`, `agent-progress`, `evidence-drawer`
- pages: `landing`, `methodology`, `auth`, `legal`, `public-try`, `home`, `classify-new`, `classification-detail`, `batch-upload`, `batch-review`, `library`, `settings`, `not-found`, `kit` (dev only)

## Routes (`app/router`, paths in `shared/config/routes.ts`)

`/` landing | `/methodology` | `/signin` | `/privacy` | `/terms` | `/try` | `/app` home | `/app/classify/new` | `/app/classifications/:id` | `/app/batches/new` | `/app/batches/:id` | `/app/library` | `/app/settings/{general|members|rules}` | `/_kit` (dev only) | `*` not found. Pages are lazy-loaded. `/app/*` is behind the session guard (mock session in mock mode).

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
