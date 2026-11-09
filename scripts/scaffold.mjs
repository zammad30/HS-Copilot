// Creates the FSD folder skeleton. Run once from the repo root: node scripts/scaffold.mjs
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const dirs = [
  "design/make-export",
  "design/screens",
  "docs/pages",
  "tests",
  "src/app/providers",
  "src/app/router",
  "src/app/layouts",
  "src/app/styles",
  "src/app/mocks/handlers",
  "src/app/mocks/fixtures",
  "src/pages",
  "src/widgets",
  "src/features",
  "src/entities",
  "src/shared/api",
  "src/shared/config",
  "src/shared/lib",
  "src/shared/ui",
  "src/shared/assets",
  "src/shared/styles/abstracts",
  "src/shared/styles/base",
];

for (const dir of dirs) {
  mkdirSync(dir, { recursive: true });
  const keep = join(dir, ".gitkeep");
  if (!existsSync(keep)) writeFileSync(keep, "");
  console.log("created", dir);
}
