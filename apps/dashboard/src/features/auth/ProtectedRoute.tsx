import { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useAuth } from './authState'
import { Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, isLoading } = useAuth()
  const location = useLocation()
  const { t } = useTranslation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--bg)]">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
          <Shield className="w-12 h-12 text-[var(--accent)] animate-pulse" />
          <p className="text-sm font-mono text-[var(--text-muted)] tracking-wider">
            {t('auth.restoringSession')}
          </p>
        </div>
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }

  return <>{children}</>
}
