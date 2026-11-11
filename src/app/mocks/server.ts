import { setupServer } from "msw/node";
import { healthHandlers } from "./handlers/health.handlers";
import { authHandlers } from "./handlers/auth.handlers";

export const server = setupServer(...healthHandlers, ...authHandlers);
