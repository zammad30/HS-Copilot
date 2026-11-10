---
description: Create a page brief from the Figma reference (no code)
argument-hint: <page-slug>
---

Create `docs/pages/$ARGUMENTS.md` from `docs/pages/_template.md`. Do NOT write or change any application code.

1. Read CLAUDE.md, design.md and docs/component-inventory.md.
2. Gather the design reference: the Figma MCP (`get_design_context`; for Figma Make files use the fileKey from the URL and nodeId `0:1`), screenshots in `design/screens/$ARGUMENTS*`, and the matching screen in `design/make-export/`. If a reference is missing, say which and stop.
   Before opening `design/make-export/src/App.tsx` itself, read `docs/make-export-index.md` first and read only the line ranges it names for the relevant screen/component.
3. Fill every section of the template: layout, exact copy, states, interactions, responsive behavior.
4. Map every UI element to an existing shared/ui component from the inventory. List new components separately with proposed props.
5. List entities, queries, mutations and the mock data needed (realistic, consistent).
6. List prototype shortcuts that must be corrected (see CLAUDE.md section 10) and every ambiguity as a question.
   Then stop and wait for my approval. Do not invent design that is not in the reference.
