import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { env } from "@/shared/config";
import { MOCK_SESSION, SessionContext } from "./sessionContext";
import type { Session } from "./session.schema";

export function SessionProvider({ children }: { children: ReactNode }) {
  // In-memory only - no localStorage, no token on disk. Real auth will set this
  // from an httpOnly cookie, never from client-readable storage.
  const [session, setSession] = useState<Session | null>(() =>
    env.useMocks ? MOCK_SESSION : null,
  );

  const value = useMemo(() => ({ session, setSession }), [session]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
