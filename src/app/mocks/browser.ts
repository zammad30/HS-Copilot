import { setupWorker } from "msw/browser";
import { healthHandlers } from "./handlers/health.handlers";
import { authHandlers } from "./handlers/auth.handlers";

export const worker = setupWorker(...healthHandlers, ...authHandlers);
