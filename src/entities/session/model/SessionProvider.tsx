import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { env } from '@/shared/config'
import { MOCK_SESSION, SessionContext } from './sessionContext'
import type { Session } from './session.types'

export function SessionProvider({ children }: { children: ReactNode }) {
  const session = useMemo<Session | null>(() => (env.useMocks ? MOCK_SESSION : null), [])

  return <SessionContext.Provider value={session}>{children}</SessionContext.Provider>
}
