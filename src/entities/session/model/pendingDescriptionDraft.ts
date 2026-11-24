import { createExpiringSessionText } from "@/shared/lib/expiringSessionText";

const THIRTY_MINUTES_MS = 30 * 60 * 1000;

/** Product text a visitor typed before signing in, handed to Classify new after. */
export const pendingDescriptionDraft = createExpiringSessionText(
  "hs-copilot:pending-description",
  THIRTY_MINUTES_MS,
);
