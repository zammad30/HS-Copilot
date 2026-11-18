import { setupServer } from "msw/node";
import { healthHandlers } from "./handlers/health.handlers";
import { authHandlers } from "./handlers/auth.handlers";
import { classificationsHandlers } from "./handlers/classifications.handlers";

export const server = setupServer(...healthHandlers, ...authHandlers, ...classificationsHandlers);
