import { useContext } from "react";
import { SessionContext } from "./sessionContext";
import type { Session } from "./session.schema";

export function useSetSession(): (session: Session | null) => void {
  return useContext(SessionContext).setSession;
}
