import { createContext } from "react";
import type { Session } from "./session.schema";

export interface SessionContextValue {
  session: Session | null;
  setSession: (session: Session | null) => void;
}

export const SessionContext = createContext<SessionContextValue>({
  session: null,
  setSession: () => {},
});

// Until the real auth endpoint exists, mock mode always starts with a signed-in reviewer.
export const MOCK_SESSION: Session = {
  userId: "user_mock_1",
  email: "reviewer@hs-copilot.test",
  workspaceId: "workspace_mock_1",
};
