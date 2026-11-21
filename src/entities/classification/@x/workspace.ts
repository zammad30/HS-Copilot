// FSD cross-import public API (@x), scoped to the "workspace" slice only.
// entities/workspace's Workspace schema carries a defaultJurisdiction, which is
// this entity's Jurisdiction (see docs/architecture.md decisions log).
export { jurisdictionSchema } from "../model/classification.schema";
export type { Jurisdiction } from "../model/classification.schema";
