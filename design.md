# HS Copilot design system

Direction: "Modern Enterprise, cool blue and slate." Clean, structured, trustworthy, restrained and practical. Strong hierarchy, purposeful spacing, consistent alignment, information-dense without feeling crowded. Light theme only.

## 1. Tokens (CSS custom properties, defined once in `shared/styles/base/_tokens.scss`)

```css
:root {
  /* color: "Modern Enterprise" theme - cool slate neutrals, slate-teal accent */
  --surface: #f7f8fa;
  --white: #ffffff;
  --ink: #172b3a;
  --text: #172b3a;
  --muted: #52616d;
  --line: #dce2e8;
  --accent: #426a78;
  --accent-hover: #365762;
  --accent-tint: #e8edef;
  --green: #286344;
  --green-tint: #e5ece9;
  --green-line: #b4c8be;
  --red: #983f3a;
  --red-tint: #f3e8e7;
  --red-line: #dbbcba;
  --amber: #826329;
  --amber-tint: #eee9e1;
  --amber-line: #d0c4ae;
  --status-pending: #526b7a;
  --status-overridden: #67527d;
  --subtle: #a6b7b9; /* non-text decoration only, never text */
  --hover: #eef1f4;
  --disabled: #929da6;
  --line-strong: #84888b;

  /* chrome (app sidebar/topbar, public header/footer) - white and light, not dark */
  --chrome: #ffffff;
  --chrome-text: #172b3a;
  --chrome-muted: #52616d;
  --chrome-line: #dce2e8;

  /* typography */
  --font-heading: "Inter", -apple-system, "Segoe UI", Arial, sans-serif;
  --font-sans: "Inter", -apple-system, "Segoe UI", Arial, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, "SF Mono", Consolas, monospace;

  /* spacing (4px base) */
  --space-05: 4px;
  --space-1: 8px;
  --space-15: 12px;
  --space-2: 16px;
  --space-3: 24px;
  --space-4: 32px;
  --space-5: 40px;
  --space-6: 48px;
  --space-8: 64px;
  --space-10: 80px;

  /* shape and elevation */
  --radius: 4px;
  --border: 1px solid var(--line);
  --shadow: none;
  --shadow-menu: 0 4px 16px rgba(23, 43, 58, 0.14);

  /* layout */
  --content: 1280px;
  --sidebar-width: 240px;
  --topbar-height: 64px;
  --control-height: 40px;
  --drawer-width: 320px;
  --modal-width: 520px;
  --toast-width: 360px;

  /* z-index scale */
  --z-sticky: 4;
  --z-sidebar: 5;
  --z-popover: 30;
  --z-drawer: 40;
  --z-modal: 50;
  --z-toast: 60;

  font-family: var(--font-sans);
}
```

This file mirrors `shared/styles/base/_tokens.scss` exactly; change both together. Inter 400/500/600 and IBM Plex Mono 400/500 via a Google Fonts `<link>` with preconnect in `index.html` (`font-display: swap`). Breakpoints (SCSS, `abstracts/_breakpoints.scss`): `$bp-tablet: 1000px`, `$bp-mobile: 720px`, desktop-first (`respond-below`). This file is the single visual source of truth - the Figma export (`design/make-export/`) and `design/screens/` are layout and copy references only, not a visual reference; take every color, font, radius and shadow from here.

## 2. Color roles (semantic rules, never break them)

| Role                   | Token                             | Use                                                                                |
| ---------------------- | --------------------------------- | ---------------------------------------------------------------------------------- |
| Page background        | `--surface`                       | page background only                                                               |
| Surfaces               | `--white`                         | cards, panels, tables, inputs, menus, modals                                       |
| Heading / primary text | `--ink`                           | headings, key values                                                               |
| Body text              | `--text`                          | paragraphs, table cells                                                            |
| Muted                  | `--muted`                         | secondary text, captions, metadata - always passes 4.5:1, safe for text            |
| Non-text decoration    | `--subtle`                        | icon strokes, chart lines, decorative marks - never text                           |
| Dividers               | `--line`                          | 1px borders, skeletons, meter tracks                                               |
| Input / checkbox edges | `--line-strong`                   | visible control borders (>= 3:1 on white)                                          |
| Neutral hover          | `--hover`                         | hover background for neutral interactive elements (rows, menu items, icon buttons) |
| Disabled               | `--disabled`                      | disabled text and controls                                                         |
| Accent                 | `--accent` (+hover, +tint)        | primary actions, links, focus ring, active nav                                     |
| Chrome                 | `--chrome` (+text, +muted, +line) | app sidebar/topbar and public header/footer surface                                |
| Approved               | `--green` (+tint, +line)          | approved status only                                                               |
| Rejected / error       | `--red` (+tint, +line)            | rejected status, errors, destructive actions                                       |
| Needs review / warning | `--amber` (+tint, +line)          | needs-review status, warning banners                                               |
| Pending                | `--status-pending`                | pending status only                                                                |
| Overridden             | `--status-overridden`             | overridden status only                                                             |

Status colors (green/red/amber/status-pending/status-overridden) are only for classification status and error or warning states - never for branding or primary actions. Status is never color alone: every status always shows as a color dot plus a text label (see Status indicator, section 5).

## 3. Typography (Inter for all UI text; IBM Plex Mono for HS codes, tariff numbers, percentages, IDs and other technical data)

| Style   | Size / line          | Weight              | Notes                                                     |
| ------- | -------------------- | ------------------- | --------------------------------------------------------- |
| Display | 40/48 (mobile 32/40) | 600                 | landing hero only, -0.01em; never use for in-app headings |
| H1      | 28/36 (mobile 24/32) | 600                 | -0.01em                                                   |
| H2      | 20/28                | 600                 |                                                           |
| H3      | 16/24                | 600                 |                                                           |
| Body    | 16/26                | 400                 | max line length 72ch                                      |
| UI      | 14/20                | 400, 500 for labels | controls, tables, nav                                     |
| Small   | 13/20                | 400                 | menus, reasoning text                                     |
| Caption | 12/16                | 500                 | `--muted`                                                 |
| Label   | 12/16                | 500                 | form labels and other standalone labels                   |

Headings use weight 600 with at most -0.01em tracking (Display and H1 only; H2/H3 have no tracking). No oversized text and no uppercase/letter-spaced eyebrow treatment - moderate headings throughout. HS codes and other technical numbers always use `--font-mono` with tabular numerals (`font-variant-numeric: tabular-nums`).

## 4. Layout

- Public pages: `shell-width` = min(100% - 64px, 1280px), centered. Section padding 112px (mobile 80px).
- App shell: fixed sidebar 240px, sticky topbar 64px, content max 1280px with 48/32/80px padding (mobile 32/16/64).
- Page header: label, H1, description (max 680px), optional action on the right (stacks on mobile).
- Grids: 12-column mental model; common splits 7/5, 5/7, 2/1, 1/1. Collapse to one column at 1000px / 720px.
- Radius 4px everywhere shape needs rounding. No card/panel shadow (`--shadow: none`; surfaces use borders instead); `--shadow-menu` is reserved for menus, popovers, dialogs and drawers.

## 5. Components (specs; implementation lives in `shared/ui`, see docs/component-inventory.md)

- **Button**: min-height 40, padding 0 16, radius `--radius`, 1.5px border, 14/20 500. Variants: primary (accent fill), secondary (ink outline), approve (same as primary - accent fill, no green), reject (transparent fill, `--line-strong` border, `--red` text; hover `--red-tint` fill + `--red-line` border), ghost (accent text). Disabled: `--hover` fill, `--disabled` text, `--line` border. Exception: the "Approved by ..." state is a green-tint chip-style button, not grey.
- **Inputs** (text, textarea, select, search): height 40 (textarea min 120), padding 0 12, 1px `--line-strong` border, radius `--radius`, label above (14/20 500), error text below in red 12/16, focus ring 2px accent offset 2. Select is native with a chevron icon. No floating labels.
- **Status indicator** (replaces the old badge/chip): a solid 8px circle, an 8px gap, then a plain medium-weight (500) 14/20 text label. No pill, no background, no border, no shadow, no glow, no animation. The dot and the label always appear together, so status is never color alone. Approved (`--green`), Rejected (`--red`), Needs review (`--amber`), Pending (`--status-pending`), Overridden (`--status-overridden`).
- **Meter (confidence)**: percentage text + 2px track in `--line`, fill in `--ink`.
- **Card**: white, 1px `--line` border, radius `--radius`, no shadow (borders carry all elevation now that `--shadow` is none).
- **DataTable**: header 48px sticky, rows 56px (dense 48), 1px row dividers (`--line`), hover `--hover`, clickable and keyboard-operable rows, optional checkbox column, row menu (184px, portal, `--shadow-menu`). Status shows as the dot-plus-label indicator in its own column; rows are never tinted by status, so hover and selected rows use the hover tokens only.
- **Modal**: width min(100%, 520px), padding 24, overlay `rgba(23, 43, 58, 0.36)` (derived from `--ink`), `--shadow-menu`, Esc and outside click close, focus trapped.
- **Popover / Menu**: min-width 280 (row menu 184), padding 8, items 40px high, 14/20, hover `--hover`, `--shadow-menu`, closes on outside click and Esc.
- **Drawer** (audit trail, evidence): right side, 320px, sticky under the topbar, `--shadow-menu`; full overlay at <=1000px.
- **Toast**: 360px, bottom-right, white background, success uses `--green` border, info/delete use `--line` border. Dismisses after 3s, or after 6s when it carries an action (e.g. Undo); the timer pauses on hover or focus and resumes on leave/blur. An action is reachable by keyboard and announced via `role="status"`.
- **Toggle**: 40x22, accent when on. **Tabs** (settings nav): active uses `--accent-tint` background + accent text.
- **Skeleton**: `--line` blocks with a 1.2s opacity fade; never spinners. **EmptyState**: `--surface` card, icon, one line, one action. **Banner**: `--amber-tint` background with `--amber-line` border (dismissible) - a warning state, not branding.
- **SampleLabel**: 10/14, `--muted` text, no background or border - marks any placeholder claim.
- **Sidebar item**: 40px, 14px, active = accent text + `--accent-tint` background + 3px accent indicator; hover `--hover`.

## 6. Patterns

- Loading: skeleton matching the final layout. Empty: EmptyState with one action. Error: error card with "Try again". Cold start: full-page "Server waking up" with indeterminate 2px progress bar.
- Destructive actions (delete, remove member) need a confirm modal and an Undo toast.
- Copy: sentence case, plain language, no emojis, no hype words. Suggestions are never presented as legal advice.
- Icons: lucide-react, 1.5px stroke, 20px (16px inside links and menus).
- Respect `prefers-reduced-motion`. Use restrained borders and subtle surface differences rather than shadows to show structure. Use a Card only where a surface needs to group something the user acts on - not as default page furniture.

## 7. Principles and avoid list

Avoid: pulsing dots or glowing pills; gradients; glassmorphism; decorative blobs; sparkle icons or AI decoration; excessive rounded cards; pastel badges or colored pills; unnecessary animation; repetitive card grids; generic dashboard layout without information hierarchy.

Prefer: strong content hierarchy, purposeful whitespace, consistent alignment, restrained borders over shadows, the color-dot-plus-label status pattern everywhere status appears.

## 8. Responsive

Check 375, 768 and 1280 widths. At <=720px the sidebar becomes a left drawer opened from a topbar hamburger, tables scroll horizontally inside their card, forms become one column, page-header actions stack.
