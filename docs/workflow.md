# Development workflow

We build page by page. Never more than one page or feature per task.

## Per-page loop
1. **Review the design.** Run `/figma-page <slug>`. Claude reads the Figma reference (MCP + screenshots) and writes `docs/pages/<slug>.md` from the template. No code.
2. **Understand requirements.** I read the brief: sections, interactions, states, responsive rules, questions. I answer questions and approve.
3. **Find reusable parts.** The brief maps every element to an existing shared/ui component or lists the new ones needed.
4. **Plan.** `/new-page <slug>` starts in plan mode: Claude lists files to create/modify and waits for my OK.
5. **Implement** in this order: shared/ui additions -> entity (schema, api, keys, queries) -> MSW handlers + fixtures -> features -> widgets -> page -> route.
6. **Mock data.** Realistic, consistent, through MSW only.
7. **Responsive + fidelity.** Compare with the reference at 375 / 768 / 1280. Report deviations.
8. **Test + verify.** `npm run check`, keyboard walkthrough, then `/check-architecture`. I review and commit.

## Definition of Done (every page)
- [ ] Matches the Figma reference (layout, spacing, copy, colors); deviations listed.
- [ ] Only existing shared/ui used, or new components added to shared/ui with test, `/_kit` entry and inventory update.
- [ ] No raw colors or off-scale spacing; styles in SCSS Modules using tokens.
- [ ] Loading, empty and error states implemented.
- [ ] Data only via entity/feature hooks; zod-parsed; mocks only in `app/mocks`.
- [ ] Responsive at 375 / 768 / 1280; keyboard-only walkthrough passes; no console errors.
- [ ] `npm run check` passes (typecheck, lint, steiger, tests).
- [ ] Tests for new shared components and the page's main flow.
- [ ] No unrelated files changed.

## Suggested page order
0. Foundation (tooling, tokens, http client, MSW, router shell, `/_kit`, one sample Button).
1. shared/ui primitives (Button, Inputs, Badge, Meter, Card, Skeleton, EmptyState, Toast), then overlays and data (Modal, Menu, Drawer, DataTable, Tabs).
2. Layouts: public-shell, app-shell.
3. Landing -> Methodology -> Auth -> Legal/404.
4. Home -> Classify new (agent progress) -> Classification detail -> Library.
5. Batch upload -> Batch review -> Settings (General, Members, Review rules).
6. Cold-start / error / empty states wiring, polish, README.

## Git
Branch per page: `feat/<slug>`. Conventional commits: `feat(library): ...`, `fix(shared-ui): ...`, `docs: ...`. One commit per completed, checked unit. Claude does not commit unless asked.

## Prompts
- Brief: `/figma-page library`
- Build: `/new-page library`
- New shared component: `/new-shared-ui Modal`
- Audit: `/check-architecture`
