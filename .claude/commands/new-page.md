---
description: Implement an approved page brief following the FSD architecture
argument-hint: <page-slug>
---

Implement the page from `docs/pages/$ARGUMENTS.md`.

1. Read CLAUDE.md, design.md, docs/architecture.md, docs/component-inventory.md and the brief. If the brief is not marked `approved`, stop and tell me.
2. Re-read the design reference (Figma MCP, screenshots). Do not redesign.
3. PLAN FIRST: list every file you will create or modify, grouped by layer, and the shared components you will reuse or add. Wait for my OK.
4. Implement in this order: shared/ui additions -> entity (schema, api, keys, queries) -> MSW handlers + fixtures -> features -> widgets -> page -> route.
5. Add tests for new shared components and the main page flow. Update docs/component-inventory.md and the `/_kit` page.
6. Run `npm run check` and fix what you broke.
7. Report: files changed, Definition of Done checklist (docs/workflow.md) with pass/fail, and every deviation from the design.
   Do not touch unrelated files. Do not commit.
