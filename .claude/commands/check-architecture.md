---
description: Audit current changes against the project rules (read-only)
---

Review `git diff` (and untracked files) against CLAUDE.md, docs/architecture.md and design.md. Do NOT edit files.
Report violations grouped as: FSD (layer/import/public-API), styling (raw colors, off-scale spacing, !important, global selectors), data (mocks imported by UI, missing zod parsing), components (duplicates, missing inventory/_kit updates), accessibility, scope creep (unrelated changes), dependency or config changes I did not approve. Include file paths and the smallest fix for each. Run `npm run check` and include the result.
