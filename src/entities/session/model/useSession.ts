import { useContext } from 'react'
import { SessionContext } from './sessionContext'
import type { Session } from './session.types'

export function useSession(): Session | null {
  return useContext(SessionContext)
}
