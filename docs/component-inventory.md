# Component inventory (living registry)

Check here before creating any component. Update this file whenever a shared or widget component is added or its API changes. Status: planned | built | needs-change.

## shared/ui

| Component                                | Purpose / variants                                                                                                 | Status  |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ------- |
| Button                                   | primary, secondary, approve, reject, ghost; icon, loading                                                          | built   |
| IconButton                               | 40px icon-only, aria-label required                                                                                | built   |
| TextInput, Textarea, Select, SearchField | labelled field with error text; controlled, native props                                                           | built   |
| FormField                                | label + control + error wrapper; useId, aria-invalid/describedby                                                   | built   |
| Checkbox, Toggle                         | table selection, settings switches; controlled                                                                     | built   |
| Badge                                    | status dot (8px) + plain text label: approved, rejected, needs-review, pending, overridden; status never color alone | built   |
| Meter                                    | value 0-100 + 2px track; value-based aria-label                                                                    | built   |
| Card                                     | default, flat (no shadow), selected                                                                                | built   |
| Modal                                    | dialog with focus trap (Radix inside)                                                                              | planned |
| Menu / Popover                           | row menu, topbar menus (portal, flip)                                                                              | planned |
| Drawer                                   | right panel                                                                                                        | planned |
| Tabs                                     | settings nav                                                                                                       | planned |
| DataTable                                | sortable columns, selection, row menu, keyboard rows                                                               | planned |
| Pagination                               | prev/next + range text                                                                                             | planned |
| FilterDropdown                           | multi-select with names                                                                                            | planned |
| Toast (provider + hook)                  | success, info                                                                                                      | planned |
| Skeleton, EmptyState, Banner             | state patterns; Skeleton aria-hidden/fade only, EmptyState icon aria-hidden (no compact), Banner amber/role=status | built   |
| ErrorState                               | state pattern                                                                                                      | planned |
| PageHeader                               | eyebrow, title, description, action; action stacks under title at 720px                                            | built   |
| Logo, SampleLabel                        | small primitives; Logo is a button with aria-label, SampleLabel defaults to "Sample data"                          | built   |
| Eyebrow                                  | label style, 12/16 500, no uppercase/tracking, `--muted`                                                           | built   |

## entities/*/ui

`classification`: ClassificationStatusBadge, ConfidenceMeter, CodeText. `batch`: BatchProgress. `member`: RoleSelect, MemberAvatar.

## widgets

| Widget               | Purpose                                   | Status                                                              |
| -------------------- | ----------------------------------------- | ------------------------------------------------------------------- |
| public-shell         | Public header, mobile nav overlay, footer | built — `widgets/public-shell`; consumed by Landing and Methodology |
| app-shell            | Sidebar, topbar, menus                    | planned                                                             |
| classification-table | Sortable/selectable classification rows   | planned                                                             |
| audit-trail          | Audit entry drawer                        | planned                                                             |
| agent-progress       | Agent research progress steps             | planned                                                             |
| evidence-drawer      | Evidence detail drawer                    | planned                                                             |
