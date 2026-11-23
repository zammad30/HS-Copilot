# Page brief: Auth (Sign in / Sign up / Reset password)

Status: approved
Route: `/signin` | `/signup` | `/reset` | FSD slice: `pages/auth` (three named page exports, one internal shared form component - same pattern as `pages/legal` hosting `PrivacyPage`/`TermsPage`)

## Design reference

- Figma URL / node: https://www.figma.com/make/v8wpvjs0lOovob7BIzYKzu/HS-Copilot-Classification-Workspace (fileKey `v8wpvjs0lOovob7BIzYKzu`, node `0:1`) - same Make file; `get_design_context` returns only source-code resource links for Make files, no rendered screenshot.
- Screenshots: **`design/screens/sign-in.png` and `sign-in.mobile.png` exist** (searched under the wrong name, `auth*`, the first time - corrected). These cover the Sign-in mode only and confirm the layout/copy read from the JSX below. **Sign-up and Reset have no screenshots** - those two modes are built from the export's JSX only (mode-dependent copy swaps, same component).
- Make source screen: `design/make-export/src/App.tsx` lines 914-1049, function `Auth` (one component, internal `signUp`/`reset` boolean state switches the mode).
- Styles: `design/make-export/src/index.css` lines 203-218 (`.text-link`), 220-261 (`.field`/`.field__label`/`.field__error`), 738-817 (`.auth-page`, `.auth-card`, `.password-input`, `.forgot-link`, `.auth-card__switch`, `.demo-link`, `.auth-note`), 2481-2491 (720px overrides).
- **Colors and button styles are taken from `design.md`** (Customs Paper), not from the export, same as Landing/Methodology.

## Purpose and user goal

Let a visitor sign in, create a workspace account, or request a password reset, with inline validation and a path back to the public site or straight into the demo workspace.

## Layout and sections (top to bottom, with spacing/columns)

Same structure on all three routes; copy and fields change by mode (see below).

1. **Page shell** - full-viewport grid (`grid-template-rows: auto 1fr auto`), `space-4` padding (mobile `space-2`).
2. **Header row** - `Logo` (left) + a "Back home" text-link (right, leading arrow-left icon).
3. **Card** (centered, `width: min(100%, 480px)`, `space-5` padding):
   - Eyebrow (mode-dependent).
   - H1 (mode-dependent).
   - Description paragraph (mode-dependent).
   - Form (single-column grid, `space-2` row gap, `space-4` margin-top):
     - Sign-up only: "Full name" field.
     - All modes: "Work email" field.
     - Sign-in + Sign-up only (not reset): "Password" field. Decided: no show/hide toggle - plain `TextInput type="password"` inside `FormField`, same composition as every other field (see Components below).
     - Sign-in only: "Forgot password?" text-link, right-aligned.
     - Submit button (stretches to the form's full width via the grid, not a special Button prop).
   - Sign-in/Sign-up only: a centered switch line ("New to HS Copilot? Create account" / "Already have an account? Sign in").
   - Reset only: "Back to sign in" link.
   - Sign-in/Sign-up only: a bordered-top "Try demo workspace" link.
4. **Footer note** - shield-check icon + "Suggestions require human approval before they are final."

## Exact copy

|              | Sign in                                         | Sign up                                           | Reset                                         |
| ------------ | ----------------------------------------------- | ------------------------------------------------- | --------------------------------------------- |
| Eyebrow      | "Welcome back"                                  | "Create account"                                  | "Reset password"                              |
| H1           | "Sign in to HS Copilot"                         | "Start your workspace"                            | "Reset your password"                         |
| Description  | "Continue to your classifications and reviews." | "Set up a review-ready classification workspace." | "We'll send a reset link to your work email." |
| Submit label | "Sign in"                                       | "Create account"                                  | "Send reset link"                             |

- Field labels: "Full name" (placeholder "Alex Morgan"), "Work email" (placeholder "alex@company.com"), "Password" (placeholder "At least 8 characters").
- Validation errors: "Enter your full name." / "Enter a valid work email address." / "Enter your password." (sign in, empty) / "Password must be at least 8 characters." (sign up).
- "Forgot password?" / "Already have an account? Sign in" / "New to HS Copilot? Create account" / "Back to sign in" / "Try demo workspace" / "Back home".
- Footer: "Suggestions require human approval before they are final."
- Submit-error banner copy (mode-specific): sign in - "We couldn't sign you in. Check your email and password and try again."; sign up - "We couldn't create your account. Check your details and try again."; reset - "We couldn't send the reset link. Try again."
- Reset success: "If that email matches a workspace, we've sent a reset link." (deliberately non-committal - see States below).

## Components

| Element                                                                                                     | Component                                               | Existing / New (+ proposed props)                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Full name, Work email, Password fields                                                                      | `FormField` + `TextInput`                               | Existing, no change. Decided: no password show/hide toggle - `TextInput type="password"`, same composition as every other field. `autoComplete` set correctly per field: name → `"name"`, email → `"email"`, password → `"current-password"` (sign in) / `"new-password"` (sign up). |
| Submit button                                                                                               | `Button`                                                | Existing. `type="submit"`, `isLoading` + `disabled` while pending.                                                                                                                                                                                                                   |
| Submit-error banner                                                                                         | `Banner`                                                | Existing (amber). Rendered above the form on a simulated mutation failure; mode-specific copy (see Exact copy).                                                                                                                                                                      |
| "Back home", "Forgot password?", "Create account"/"Sign in" switch, "Back to sign in", "Try demo workspace" | react-router `Link` / `useNavigate`, page-local styling | Not shared components - plain text/icon links, same pattern as `widgets/public-shell`'s nav links.                                                                                                                                                                                   |
| Card                                                                                                        | `Card`                                                  | Existing, `variant="default"`, unchanged. Decided: keeps its shadow at all sizes - the export's mobile "flat" treatment is not followed.                                                                                                                                             |

No new shared/ui components this task.

## Data

This is the first page requiring an actual mutation, not just static content. Per `docs/architecture.md`: reads live in `entities/*/api`, writes in `features/*/api`. Proposed shape:

- **`features/auth`** (new) - `api/signIn.mutation.ts`, `api/signUp.mutation.ts`, `api/resetPassword.mutation.ts`, each a TanStack Query mutation calling `shared/api/http.ts` against the already-documented contract paths (`docs/api-contract.md`: `POST /auth/sign-in`, `/auth/sign-up`, `/auth/reset`). `ui/` holds the shared form component all three pages render with a `mode` prop.
- **MSW** - `app/mocks/handlers/auth.handlers.ts` + a fixture, using the existing `randomLatency()`/`forcedErrorResponse()` helpers (replacing the prototype's flat 600ms `setTimeout`), returning a success shape even though no real session data model exists yet (see note below).
- **Session wiring is explicitly out of scope here** (decided) - `entities/session`'s `SessionProvider` currently always grants a mock session whenever `VITE_USE_MOCKS=true`, independent of whether sign-in happened. Making a successful sign-in actually set session state belongs in the Home page's brief, not this one. This page's mutations hit MSW and navigate on success; they don't touch `entities/session`.

## States

- **Idle** - form enabled, no errors.
- **Validation error** (client-side, before submit) - per-field inline error via `FormField`'s `error` prop; focus stays in the form; submit button stays enabled (per the export: errors don't disable the button, they just block that one submit attempt).
- **Loading** - submit button `isLoading`, all fields `disabled`, whole form non-interactive while the mock request is in flight (300-700ms).
- **Submit error** (server/mock-simulated, e.g. `?forceError=`) - decided: a `Banner` above the form, mode-specific copy (see Exact copy). The typed email is kept; the password field is cleared (sign in/sign up only - reset has no password field).
- **Submit success**:
  - Sign in / Sign up → `navigate(routes.home)`.
  - Reset → decided: replaces the form in place with "If that email matches a workspace, we've sent a reset link." + a "Back to sign in" link. Deliberately doesn't confirm or deny the email is a real account (no user enumeration) - this is why the copy is non-committal rather than "we've sent a reset link to you," and why it's identical regardless of what the mock backend actually knows about the address.

## Interactions

- All navigation (Back home, mode switch, Back to sign in, Try demo workspace) uses real routes (`Link`/`useNavigate`), not internal state - this is the task's explicit correction over the prototype's single-component `go()`/`setSignUp()` pattern.
- Submit validates client-side first (see Validation rules), then calls the mode's mutation. Submit button is `disabled` for the duration of the request (not just visually loading).
- `routes.ts` needs two new entries (`signUp: "/signup"`, `resetPassword: "/reset"`) and `router.tsx` needs two new lazy route entries, alongside the existing `/signin`.

## Validation rules (decided, tightened from the export's logic)

- **Full name** (sign-up only): required after trim → "Enter your full name."
- **Work email** (all modes): trimmed, basic `name@domain.tld` pattern, max 254 characters → "Enter a valid work email address."
- **Password**:
  - Sign in: required (non-empty) only, no minimum-length check → "Enter your password."
  - Sign up: minimum 8 characters → "Password must be at least 8 characters."
  - Reset: no password field.
- All errors are per-field and inline via `FormField`'s `error` prop.

## Responsive behavior (≤720px only - same single breakpoint as every other public page)

- Page padding drops from `space-4` to `space-2`.
- Header's "Back home" link collapses to icon-only. Proposing `visually-hidden` on the label text at this breakpoint (accessible-name-preserving) instead of the export's `font-size: 0` trick (which also works, but `visually-hidden` is the documented mixin for this exact purpose) - flagged as a deliberate small improvement, not a visual change.
- Card: unchanged at mobile - keeps its shadow (decided, no deviation here despite the export removing it).

## Prototype corrections that apply here

- **#5 Navigation by state, not URL** - the export's entire mode-switching (`signUp`/`reset` booleans) becomes three real routes.
- **#2 Hardcoded/cosmetic behavior** - the export's submit is a pure `setTimeout`, no real request and no failure path; replaced with an MSW-backed mutation with realistic latency and a simulable error.
- Shortcuts #1, #3, #4, #6 don't apply (no alert/confirm, no override/reject, no waking screen, no tables/menus).

## Decisions (resolved 2026-11-12)

1. **Password toggle** - dropped. Plain `TextInput type="password"`, correct `autoComplete` values kept (see Components).
2. **Card** - no change; keeps its shadow at all sizes.
3. **Submit error** - `Banner` above the form, mode-specific copy; typed email kept, password cleared.
4. **Reset success** - in-place "If that email matches a workspace, we've sent a reset link." - doesn't reveal whether the account exists.
5. **Validation** - email: trim, `name@domain.tld` pattern, max 254. Password: required on sign in, min 8 on sign up. Inline per-field errors. Submit `disabled` while pending.
6. **Screenshots** - `design/screens/sign-in.png`/`.mobile.png` exist and are now cited above; sign-up/reset have none and are built from the JSX only.
7. **Session wiring** - out of scope; deferred to the Home page's brief.

## Acceptance criteria (testable)

- [ ] Three real routes (`/signin`, `/signup`, `/reset`), each lazy-loaded, each showing the correct mode-specific copy.
- [ ] All navigation within the flow (mode switch, back home, back to sign in, try demo) is a real route change, not internal state.
- [ ] Client-side validation matches the rules above exactly, with per-field inline errors via `FormField`.
- [ ] No password show/hide toggle; password fields use correct `autoComplete` values.
- [ ] Submitting a valid form disables the fields and submit button, shows the loading state, and - on mock success - navigates (sign in/up) or shows the reset confirmation; on mock failure, shows the `Banner` with mode-specific copy, keeps the typed email, clears the password.
- [ ] Reset success copy never reveals whether the email matched a real account.
- [ ] `features/auth` mutations go through MSW with realistic latency (300-700ms), not a raw timeout.
- [ ] Colors/button styles from `design.md` only; `Card` keeps its shadow at all sizes.
- [ ] No raw hex/off-scale spacing in new SCSS; `docs/component-inventory.md` updated if anything changes (no new shared components expected).
- [ ] `npm run check` passes.
- [ ] Responsive: single collapse point at 720px, verified at 375/768/1280 against `sign-in.png`/`sign-in.mobile.png` for sign-in; sign-up/reset verified against the JSX only.

## Return path (plans, limits and expiry, step 6)

- Sign-in and sign-up read an optional `?next=<path>` and, after success, `navigate(path, { replace: true })`, so Back does not return to the form. A signed-in visitor who opens either page with `?next=` is redirected there too.
- The path is validated by `safeReturnPath` (`shared/lib`) and nothing else. It accepts only a known app route: the static routes in `shared/config/routes.ts` plus `/app/classifications/<id>` and `/app/batches/<id>` (one safe segment). Everything else falls back to `/app`: other schemes or hosts, `//`, a leading `/\`, any backslash, whitespace or control character (including a leading space, a tab, a newline), encoded tricks such as `/%2Fevil.com` or `/app%0d%0a`, values over 200 characters, non-strings, and a repeated `next` param.
- Query strings and hashes are dropped (`/app?x=1` becomes `/app`): the destination is a page, never carried state.
- Auth screens (`/signin`, `/signup`, `/reset`) and `/_kit` are known routes but are not accepted as a destination (they would loop or are dev only), so they fall back to `/app`.
- The "Create account" and "Sign in" switch links carry the validated `next` along.
- The typed text is never in the URL. A page that wants it kept saves it with `pendingDescriptionDraft` before linking to sign-up or sign-in.

### Known gaps

- `/try` is still a placeholder page (no brief yet), so nothing links to sign-up with a `next` path or saves a draft today.
- Landing still passes the typed text in `?q=` to `/try` (to fix in step 6b).
- Home still hands text to Classify new through `?q=`. It is a signed-in handoff, accepted as debt.
