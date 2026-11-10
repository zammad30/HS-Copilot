import { createContext } from "react";
import type { Session } from "./session.types";

export const SessionContext = createContext<Session | null>(null);

// Until the real auth endpoint exists, mock mode always has a signed-in reviewer.
export const MOCK_SESSION: Session = {
  userId: "user_mock_1",
  email: "reviewer@hs-copilot.test",
  workspaceId: "workspace_mock_1",
};
