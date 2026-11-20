import { setupServer } from "msw/node";
import { healthHandlers } from "./handlers/health.handlers";
import { authHandlers } from "./handlers/auth.handlers";
import { classificationsHandlers } from "./handlers/classifications.handlers";
import { agentRunsHandlers } from "./handlers/agentRuns.handlers";
import { membersHandlers } from "./handlers/members.handlers";
import { meHandlers } from "./handlers/me.handlers";
import { workspaceHandlers } from "./handlers/workspace.handlers";
import { reviewRulesHandlers } from "./handlers/reviewRules.handlers";
import { batchesHandlers } from "./handlers/batches.handlers";
import { plansHandlers } from "./handlers/plans.handlers";

export const server = setupServer(
  ...healthHandlers,
  ...authHandlers,
  ...classificationsHandlers,
  ...agentRunsHandlers,
  ...membersHandlers,
  ...meHandlers,
  ...workspaceHandlers,
  ...reviewRulesHandlers,
  ...batchesHandlers,
  ...plansHandlers,
);
