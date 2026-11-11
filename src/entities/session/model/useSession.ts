import { useContext } from "react";
import { SessionContext } from "./sessionContext";
import type { Session } from "./session.schema";

export function useSession(): Session | null {
  return useContext(SessionContext).session;
}
