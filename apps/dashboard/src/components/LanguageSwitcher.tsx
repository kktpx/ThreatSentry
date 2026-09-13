import { useTranslation } from 'react-i18next'

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const currentLang = i18n.language

  const toggle = () => {
    const newLang = currentLang === 'en' ? 'th' : 'en'
    i18n.changeLanguage(newLang)
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold
        text-[var(--text-secondary)] hover:text-[var(--text)]
        border border-[var(--border)] hover:border-[var(--border-hover)]
        bg-[var(--surface)] transition-all cursor-pointer font-mono"
    >
      <span className={currentLang === 'en' ? 'text-[var(--accent)]' : ''}>EN</span>
      <span className="text-[var(--text-muted)]">|</span>
      <span className={currentLang === 'th' ? 'text-[var(--accent)]' : ''}>TH</span>
    </button>
  )
}
