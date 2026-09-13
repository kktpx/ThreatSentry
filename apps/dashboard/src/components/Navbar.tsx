import { Link, useNavigate } from 'react-router'
import { Shield, Settings, LogOut, Menu, Activity } from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../features/auth/authState'
import { supabase } from '../lib/supabase'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from './LanguageSwitcher'

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const { session } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  if (!session) return null

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--surface)] sticky top-0 z-40 backdrop-blur-md bg-opacity-90">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Brand */}
          <div className="flex">
            <div className="flex-shrink-0 flex items-center gap-2">
              <Shield className="w-6 h-6 text-[var(--accent)]" />
              <Link to="/dashboard" className="font-sans font-bold text-lg tracking-tight text-[var(--text)] no-underline">
                ThreatSentry
              </Link>
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden sm:flex sm:items-center sm:space-x-8">
            <Link to="/dashboard" className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors no-underline">
              {t('navbar.dashboard')}
            </Link>
            <Link to="/dashboard" className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors no-underline">
              {t('navbar.targets')}
            </Link>
            <Link to="/model" className="text-sm font-semibold text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors no-underline flex items-center gap-1.5">
              <Activity className="w-4 h-4" />
              {t('navbar.mlIntelligence')}
            </Link>
            
            <div className="h-4 w-px bg-[var(--border)] mx-2"></div>
            
            <LanguageSwitcher />

            <div className="flex items-center gap-3 pl-2">
              <button className="text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer" aria-label="Settings">
                <Settings className="w-5 h-5" />
              </button>
              <button 
                onClick={handleSignOut}
                className="text-[var(--text-muted)] hover:text-[var(--danger)] transition-colors cursor-pointer" 
                aria-label={t('navbar.signOut')}
                title={t('navbar.signOut')}
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center sm:hidden gap-4">
            <LanguageSwitcher />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-[var(--text-secondary)] hover:text-[var(--text)]"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="sm:hidden border-t border-[var(--border)] bg-[var(--surface-2)]">
          <div className="pt-2 pb-3 space-y-1">
            <Link 
              to="/dashboard"
              className="block px-4 py-2 text-base font-medium text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg)] no-underline"
              onClick={() => setIsOpen(false)}
            >
              {t('navbar.dashboard')}
            </Link>
            <Link 
              to="/dashboard"
              className="block px-4 py-2 text-base font-medium text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg)] no-underline"
              onClick={() => setIsOpen(false)}
            >
              {t('navbar.targets')}
            </Link>
            <Link 
              to="/model"
              className="block px-4 py-2 text-base font-medium text-[var(--text-secondary)] hover:text-[var(--text)] hover:bg-[var(--bg)] no-underline"
              onClick={() => setIsOpen(false)}
            >
              {t('navbar.mlIntelligence')}
            </Link>
            <button
              onClick={() => {
                setIsOpen(false)
                handleSignOut()
              }}
              className="block w-full text-left px-4 py-2 text-base font-medium text-[var(--danger)] hover:bg-[var(--bg)] cursor-pointer"
            >
              {t('navbar.signOut')}
            </button>
          </div>
        </div>
      )}
    </nav>
  )
}
