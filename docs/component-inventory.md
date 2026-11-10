# Component inventory (living registry)

Check here before creating any component. Update this file whenever a shared or widget component is added or its API changes. Status: planned | built | needs-change.

## shared/ui

| Component                                | Purpose / variants                                         | Status  |
| ---------------------------------------- | ---------------------------------------------------------- | ------- |
| Button                                   | primary, secondary, approve, reject, ghost; icon, loading  | built   |
| IconButton                               | 40px icon-only, aria-label required                        | built   |
| TextInput, Textarea, Select, SearchField | labelled field with error text; controlled, native props    | built   |
| FormField                                | label + control + error wrapper; useId, aria-invalid/describedby | built |
| Checkbox, Toggle                         | table selection, settings switches; controlled              | built   |
| Badge                                    | approved, rejected, needs-review, pending, neutral, accent | planned |
| Meter                                    | value + 2px track                                          | planned |
| Card                                     | default, flat (no shadow), selected                        | planned |
| Modal                                    | dialog with focus trap (Radix inside)                      | planned |
| Menu / Popover                           | row menu, topbar menus (portal, flip)                      | planned |
| Drawer                                   | right panel                                                | planned |
| Tabs                                     | settings nav                                               | planned |
| DataTable                                | sortable columns, selection, row menu, keyboard rows       | planned |
| Pagination                               | prev/next + range text                                     | planned |
| FilterDropdown                           | multi-select with names                                    | planned |
| Toast (provider + hook)                  | success, info                                              | planned |
| Skeleton, EmptyState, ErrorState, Banner | state patterns                                             | planned |
| PageHeader                               | eyebrow, title, description, action                        | planned |
| Logo, SampleLabel, Eyebrow               | small primitives                                           | planned |

## entities/*/ui

`classification`: ClassificationStatusBadge, ConfidenceMeter, CodeText. `batch`: BatchProgress. `member`: RoleSelect, MemberAvatar.

## widgets

app-shell, public-shell, classification-table, audit-trail, agent-progress, evidence-drawer.
