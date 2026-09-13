import { Shield, Cpu, LogOut, Languages } from 'lucide-react'
import { useAuth } from '../features/auth/authState'
import { useTranslation } from 'react-i18next'

export function Navbar() {
  const { t, i18n } = useTranslation()
  let currentPath = ''
  if (typeof window !== 'undefined') {
    currentPath = window.location.pathname
  }

  let signOut = async () => {}
  let userEmail: string | null = null
  try {
    const auth = useAuth()
    signOut = auth.signOut
    userEmail = auth.session?.user?.email || null
  } catch {
    // Gracefully handle rendering in tests without AuthProvider
  }

  const isActive = (path: string) => currentPath === path

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'th' : 'en'
    i18n.changeLanguage(newLang)
  }

  return (
    <nav className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-[var(--bg)]/80 backdrop-blur-md border-b border-[var(--border)]">
      <div className="flex items-center gap-8">
        <a href="/dashboard" className="flex items-center gap-2.5 text-inherit no-underline font-sans font-bold text-lg tracking-tight text-[var(--text)]">
          <Shield className="w-5 h-5 text-[var(--accent)]" />
          <span>ThreatSentry</span>
        </a>

        <div className="hidden md:flex items-center gap-6 list-none m-0 p-0">
          <a
            href="/dashboard"
            className={`text-sm font-medium transition-colors no-underline ${
              isActive('/dashboard')
                ? 'text-[var(--text)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
            }`}
          >
            {t('navbar.dashboard')}
          </a>
          <a
            href="/websites/new"
            className={`text-sm font-medium transition-colors no-underline ${
              isActive('/websites/new')
                ? 'text-[var(--text)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
            }`}
          >
            <span>Targets</span>
          </a>
          <a
            href="/model"
            className={`text-sm font-medium transition-colors no-underline flex items-center gap-1.5 ${
              isActive('/model')
                ? 'text-[var(--text)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text)]'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>{t('navbar.mlIntelligence')}</span>
          </a>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggleLanguage}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text)] border border-transparent transition-all cursor-pointer bg-transparent"
          title="Toggle Language"
        >
          <Languages className="w-4 h-4" />
          <span className="uppercase text-xs font-mono">{i18n.language === 'en' ? t('lang.th') : t('lang.en')}</span>
        </button>

        {userEmail && (
          <span className="hidden lg:inline-block text-xs font-mono text-[var(--text-muted)] tracking-tight">
            {userEmail}
          </span>
        )}
        <button
          type="button"
          onClick={() => void signOut()}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text)] border border-[var(--border)] hover:border-[var(--border-hover)] bg-[var(--surface)] transition-all cursor-pointer font-sans"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden sm:inline-block">{t('navbar.signOut')}</span>
        </button>
      </div>
    </nav>
  )
}
