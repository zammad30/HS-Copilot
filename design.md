# HS Copilot design system

Source: the Figma Make prototype "HS Copilot Classification Workspace" (frozen copy). Where this file and Figma disagree, Figma wins; report the difference. Tone: calm, editorial, precise. Light theme only.

## 1. Tokens (CSS custom properties, defined once in `shared/styles/base/_tokens.scss`)

```css
:root {
  /* color: "Customs Paper" theme — warm paper, ink text, petrol-teal accent */
  --white: #ffffff;
  --ink: #1b1a17;
  --text: #3d3a34;
  --muted: #6f6a5f;
  --line: #e4dfd3;
  --surface: #f6f3ec;
  --accent: #0e4a5c;
  --accent-hover: #0a3846;
  --accent-tint: #e1edf0;
  --green: #2d6a3e;
  --green-tint: #e6f1e8;
  --green-line: #b9d6bf;
  --red: #a8322b;
  --red-tint: #f8e5e2;
  --red-line: #e6b8b2;
  --amber: #7a4f00;
  --amber-tint: #fbf0d5;
  --amber-line: #e8cf94;
  /* typography */
  --font-mono: ui-monospace, "SF Mono", Consolas, monospace;
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
  --radius: 8px;
  --border: 1px solid var(--line);
  --shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
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
  font-family: "Inter", sans-serif;
}
```

Inter 400/500/600 via Google Fonts `<link>` with preconnect in `index.html`.
Breakpoints (SCSS, `abstracts/_breakpoints.scss`): `$bp-tablet: 1000px`, `$bp-mobile: 720px`, desktop-first (`respond-below`).
HS codes and other monospaced numerals use `--font-mono` (system monospace stack, no font download).

> **Note:** this file is the color source of truth. The Figma Make export (`design/make-export/`) and the reference screenshots (`design/screens/`) still show the earlier palette (cool white/blue-grey "AI SaaS" look) and have not been regenerated against "Customs Paper." When writing a page brief, take layout and copy from Figma/the export, but take colors from this file.

## 2. Color roles (semantic rules, never break them)

| Role                                                                                                                                                                                                               | Token                      | Use                                                                                     |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------- | --------------------------------------------------------------------------------------- |
| Heading / primary text                                                                                                                                                                                             | `--ink`                    | headings, key values, secondary-button outline                                          |
| Body text                                                                                                                                                                                                          | `--text`                   | paragraphs, table cells                                                                 |
| Muted                                                                                                                                                                                                              | `--muted`                  | captions, placeholders, helper text                                                     |
| Borders / dividers / tracks                                                                                                                                                                                        | `--line`                   | every 1px border, skeletons, meter tracks                                               |
| Neutral surface                                                                                                                                                                                                    | `--surface`                | page sections, hover and selected-row tint, dropzone, empty state                       |
| Accent                                                                                                                                                                                                             | `--accent` (+hover, +tint) | primary actions, links, focus ring, active nav, hero code                               |
| Approved / success                                                                                                                                                                                                 | `--green` (+tint, +line)   | approved status, success toast                                                          |
| Rejected / error / destructive                                                                                                                                                                                     | `--red` (+tint, +line)     | rejected status, errors, delete, reject action (text/border only, see Button below)     |
| Needs review / needs input / warning                                                                                                                                                                               | `--amber` (+tint, +line)   | needs-review chip, review rows, throttle banner, paused agent step, clarifying question |
| Red means rejected, error or destructive only. Never use red for "waiting". Status is always color + icon + text label.                                                                                            |
| Green and red are status colors only, never action-button fills. The approve button uses the accent fill (same as primary); the reject button uses red for its outline/text only, never a solid red or green fill. |

## 3. Typography (Inter only, everywhere: headings, body, inputs, tables, codes)

| Style                                                                                              | Size / line                                            | Weight              | Notes                                             |
| -------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------- | ------------------------------------------------- |
| Display                                                                                            | 48/56 (hero mobile 40/48; key stat numbers stay 48/56) | 600                 | hero and key stat numbers, letter-spacing -0.02em |
| H1                                                                                                 | 32/40                                                  | 600                 | -0.02em                                           |
| H2                                                                                                 | 24/32                                                  | 600                 | -0.015em                                          |
| H3                                                                                                 | 18/28                                                  | 600                 |                                                   |
| Body                                                                                               | 16/24                                                  | 400                 | max line length 72ch                              |
| UI                                                                                                 | 14/20                                                  | 400, 500 for labels | controls, tables, nav                             |
| Small                                                                                              | 13/20                                                  | 400                 | menus, reasoning text                             |
| Caption                                                                                            | 12/16                                                  | 500                 | `--muted`                                         |
| Eyebrow                                                                                            | 12/16                                                  | 500                 | uppercase, letter-spacing 0.08em                  |
| HS codes and numbers use tabular numerals (`font-variant-numeric: tabular-nums`) in the same font. |

## 4. Layout

- Public pages: `shell-width` = min(100% - 64px, 1280px), centered. Section padding 112px (mobile 80px).
- App shell: fixed sidebar 240px, sticky topbar 64px, content max 1280px with 48/32/80px padding (mobile 32/16/64).
- Page header: eyebrow, H1, description (max 680px), optional action on the right (stacks on mobile).
- Grids: 12-column mental model; common splits 7/5, 5/7, 2/1, 1/1. Collapse to one column at 1000px / 720px.
- Radius 8px everywhere. The only shadow is `--shadow`, used on cards, menus, drawers, modals.

## 5. Components (specs; implementation lives in `shared/ui`, see docs/component-inventory.md)

- **Button**: min-height 40, padding 0 16, radius 8, 1.5px border, 14/20 500. Variants: primary (accent fill), secondary (ink outline), approve (same as primary — accent fill, no green), reject (transparent fill, `--line` border, `--red` text; hover `--red-tint` fill + `--red-line` border), ghost (accent text). Disabled: `--line` fill, `--text` text. Exception: the "Approved by ..." state is a green-tint chip-style button, not grey.
- **Inputs** (text, textarea, select, search): height 40 (textarea min 120), padding 0 12, 1px `--line`, radius 8, label above (14/20 500), error text below in red 12/16, focus ring 2px accent offset 2. Select is native with a chevron icon. No floating labels.
- **Badge / status chip**: min-height 26, padding 2 8, radius 8, 12/16 500, icon 14px + label. approved (green on green-tint, green border), rejected (red on red-tint), needs-review (amber on amber-tint, amber-line border), pending (text on white, text border).
- **Meter (confidence)**: percentage text + 2px track in `--line`, fill in `--ink`.
- **Card**: white, 1px line, radius 8, `--shadow`. Table cards and evidence cards have no shadow.
- **DataTable**: header 48px sticky, rows 56px (dense 48), 1px row dividers, hover `--surface`, clickable and keyboard-operable rows, optional checkbox column, row menu (184px, portal). Needs-review rows get an amber-tint row background.
- **Modal**: width min(100%, 520px), padding 24, overlay rgba(16,20,24,0.36), Esc and outside click close, focus trapped.
- **Popover / Menu**: min-width 280 (row menu 184), padding 8, items 40px high, 14/20, hover `--surface`, closes on outside click and Esc.
- **Drawer** (audit trail, evidence): right side, 320px, sticky under the topbar; full overlay at <=1000px.
- **Toast**: 360px, bottom-right, 3s, success uses green border, info/delete neutral border.
- **Toggle**: 40x22, accent when on. **Tabs** (settings nav): active uses accent-tint background + accent text.
- **Skeleton**: `--line` blocks with a 1.2s opacity fade; never spinners. **EmptyState**: `--surface` card, icon, one line, one action. **Banner**: amber-tint with amber-line border (dismissible).
- **SampleLabel**: 10/14 pill, `--muted`, marks any placeholder claim.
- **Sidebar item**: 40px, 14px, active = accent text + accent-tint + 3px accent indicator; hover `--surface`.

## 6. Patterns

- Loading: skeleton matching the final layout. Empty: EmptyState with one action. Error: error card with "Try again". Cold start: full-page "Server waking up" with indeterminate 2px progress bar.
- Destructive actions (delete, remove member) need a confirm modal and an Undo toast.
- Copy: sentence case, plain language, no emojis, no hype words. Suggestions are never presented as legal advice.
- Icons: lucide-react, 1.5px stroke, 20px (16px inside links and menus).

## 7. Responsive

Check 375, 768 and 1280 widths. At <=720px the sidebar becomes a left drawer opened from a topbar hamburger, tables scroll horizontally inside their card, forms become one column, page-header actions stack.
