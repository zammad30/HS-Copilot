import { Navigate, Outlet } from 'react-router'
import { routes } from '@/shared/config'
import { useSession } from '../model/useSession'

export function RequireSession() {
  const session = useSession()

  if (!session) {
    return <Navigate to={routes.signIn} replace />
  }

  return <Outlet />
}
