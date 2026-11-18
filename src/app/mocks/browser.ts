import { setupWorker } from "msw/browser";
import { healthHandlers } from "./handlers/health.handlers";
import { authHandlers } from "./handlers/auth.handlers";
import { classificationsHandlers } from "./handlers/classifications.handlers";
import { agentRunsHandlers } from "./handlers/agentRuns.handlers";

export const worker = setupWorker(
  ...healthHandlers,
  ...authHandlers,
  ...classificationsHandlers,
  ...agentRunsHandlers,
);
