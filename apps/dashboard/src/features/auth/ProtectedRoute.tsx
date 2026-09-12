import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'

import { useAuth } from './authState'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isLoading, session } = useAuth()
  const location = useLocation()
  if (isLoading) {
    return <main className="app-shell"><p>Restoring your secure session...</p></main>
  }
  if (!session) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <>{children}</>
}
