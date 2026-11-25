# Page brief: Try (public sample result)

Status: approved
Route: `/try` | FSD slice: `pages/public-try`

> Design note: `design/screens/try.png` and `try.mobile.png` are the signed-in Classification detail screen, not a /try design. The prototype has no try screen (its Landing form opens the signed-in result). The /try layout is derived from that screen with all actions removed.

## Design reference

- Screenshots: `design/screens/try.png` (desktop), `design/screens/try.mobile.png` (390px). Layout and copy only; every visual value comes from `design.md`.
- Source of the content: the detail screen's recommended code card, top suggestions, tariff text card and past ruling card.
- Chrome: `widgets/public-shell` (`PublicHeader`, `MobileMenu`, `PublicFooter`), same as Methodology.

## Purpose and user goal

Show a visitor what a result looks like and move them toward an account. The page never classifies the visitor's text: a public classification call would be costly and abusable, and no endpoint offers one. The result shown is a static sample for a different product, labelled as such.

## Layout (one centred column, compact)

1. `PageHeader`: eyebrow "Sample result", H1 "See how a result looks", description "This is an example for a different product, not an answer for your text. Create an account to classify your own."
2. "Your description" (H2): a `Card` with the saved text, or the no-draft note.
3. "Sample result" (H2) with a `SampleLabel`:
   - Recommended code card: `CodeText` 6109.10, confidence `Meter` 96%, product title (H3), reasoning paragraph, three basis items as a plain list.
   - "Top suggestions" (H3): ordered list of three candidates, each with code, title and a confidence `Meter`. Read-only.
   - Two evidence cards: Tariff text (reference and quote) and Similar past ruling (HQ 610910-26 with a `SampleLabel`).
4. Call to action (see Interactions).
5. Disclaimer, same wording as the detail page: "This is a classification suggestion to support your decision. Confirm it with a licensed customs broker or your customs authority before you file."

Left out of the detail layout on purpose: app shell, audit drawer, "Approved" status, "Approved by ...", Undo, Override, Reject, Ask for more info, "View reasoning", "Open source", "View ruling". A visitor cannot decide on a sample, and "Approved" on a fake record would be a false claim.

## Components

| Element                       | Component                                                                            | Existing / New |
| ----------------------------- | ------------------------------------------------------------------------------------ | -------------- |
| Header, footer, mobile menu   | `widgets/public-shell`                                                               | Existing       |
| Title block                   | `PageHeader`                                                                         | Existing       |
| Surfaces                      | `Card`                                                                               | Existing       |
| Confidence                    | `Meter`                                                                              | Existing       |
| Placeholder marks             | `SampleLabel`                                                                        | Existing       |
| Codes                         | `CodeText` (`entities/classification`)                                               | Existing       |
| Call-to-action and back links | react-router `Link`, page-local styles (`Button` renders a `<button>`, no `asChild`) | Page-local     |

No new shared/ui component.

## Data

No request and no mutation. The sample is page-local static data (`model/sampleResult.constants.ts`, `isSample: true`). The visitor's text is read once with `pendingDescriptionDraft.read(DESCRIPTION_MAX_LENGTH)` (`entities/session`) and never cleared here; it is cleared when Classify new uses it, on sign out, or after 30 minutes. The text is never in a URL or router state. `DESCRIPTION_MAX_LENGTH` lives in `entities/classification`.

## States

- **Draft present:** the text is shown as plain text in "Your description".
- **No draft** (nothing saved, expired, or sessionStorage unreadable): the card shows "Describe a product to see it here." with a "Back to home" link to the landing page. No input and no form.
- **Signed in or signed out:** only the call to action differs. The page never redirects.
- No loading or error state: there is no request.

## Interactions

- Signed out: "Create account" goes to `/signup?next=%2Fapp%2Fclassify%2Fnew` and "Sign in" to `/signin?next=%2Fapp%2Fclassify%2Fnew`. The path is built from `safeReturnPath(routes.classifyNew)`; no text is in any link.
- Signed in: "Continue in Classify new" goes to `routes.classifyNew`.
- Clicking any of these leaves the draft saved, so Classify new prefills it.
- Header and footer behave as on Methodology.

## Accessibility

One H1, H2 per block, H3 inside the sample. Candidates are an ordered list, confidence is shown as text as well as the meter. All links are real links with a visible focus ring. The visitor's text renders as text, never HTML. The page sets its document title.

## Responsive (720px)

Single column. The code and its meter stack. Candidates stack. The evidence cards stack at 1000px. The call-to-action links stack full width. Touch targets are at least 40px.

## Acceptance criteria

- [ ] Shows the saved text, or the no-draft note with a link home when there is none or storage throws.
- [ ] The sample result is labelled "Sample result" with `SampleLabel`, and the ruling has its own `SampleLabel`.
- [ ] Disclaimer line present, wording identical to the detail page.
- [ ] Signed out: links carry only the safe `next` path. Signed in: "Continue in Classify new". No redirect.
- [ ] The draft is still saved after clicking any call to action.
- [ ] No text appears in any href.
- [ ] `npm run check` passes.

### Known gaps

- Layout at 390px and a keyboard walkthrough are not yet checked in a browser.

**Landmarks and title (step 7b)**: `<main id="main-content">`, skip link from `PublicHeader`; document title is "Sample result | HS Copilot".
