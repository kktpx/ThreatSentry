import { Shield } from 'lucide-react'
import { useTranslation } from 'react-i18next'
;

export function MarketingFooter() {
  const { t } = useTranslation()
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--surface)] py-16 px-6 md:px-12 mt-24">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-[var(--accent)]" />
            <span className="font-bold text-lg text-[var(--text)] tracking-tight">ThreatSentry</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] max-w-xs">
            {t('auth.loginTagline')}
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-[var(--text)] mb-4">Product</h4>
          <ul className="space-y-3 list-none p-0 m-0 text-sm text-[var(--text-secondary)]">
            <li><a href="/dashboard" className="hover:text-[var(--accent)] transition-colors no-underline text-inherit">Dashboard</a></li>
            <li><a href="/model" className="hover:text-[var(--accent)] transition-colors no-underline text-inherit">ML Intelligence</a></li>
            <li><a href="#coverage" className="hover:text-[var(--accent)] transition-colors no-underline text-inherit">Security Coverage</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-[var(--text)] mb-4">Project</h4>
          <ul className="space-y-3 list-none p-0 m-0 text-sm text-[var(--text-secondary)]">
            <li><a href="https://github.com/kktpx/Threatsentry" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] transition-colors no-underline text-inherit">GitHub</a></li>
            <li><a href="https://github.com/kktpx/Threatsentry#readme" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] transition-colors no-underline text-inherit">Documentation</a></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold text-[var(--text)] mb-4">Security</h4>
          <ul className="space-y-3 list-none p-0 m-0 text-sm text-[var(--text-secondary)]">
            <li className="text-inherit">Authorized Use</li>
            <li><a href="https://owasp.org/" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--accent)] transition-colors no-underline text-inherit">OWASP</a></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-[var(--border)] flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
        <p>ThreatSentry — Built for security research, defensive testing and authorized assessments.</p>
        <p>{t('common.copyright', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}

