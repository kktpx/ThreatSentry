import { useTranslation } from 'react-i18next'
export function MetricsStrip() {
  const { t } = useTranslation()
  return (
    <section className="border-y border-[var(--border)] bg-[var(--surface-2)]">
      <div className="max-w-[1280px] mx-auto grid grid-cols-2 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-[var(--border)]">
        <div className="p-8 text-center flex flex-col justify-center">
          <div className="text-xl md:text-2xl font-bold font-mono text-[var(--text)] mb-1">PASSIVE + ACTIVE</div>
          <div className="text-sm font-medium text-[var(--text-secondary)]">Hybrid scanning</div>
        </div>
        
        <div className="p-8 text-center flex flex-col justify-center border-l lg:border-l-0 border-[var(--border)]">
          <div className="text-xl md:text-2xl font-bold font-mono text-[var(--accent)] mb-1">ML IDS</div>
          <div className="text-sm font-medium text-[var(--text-secondary)]">Threat classification</div>
        </div>

        <div className="p-8 text-center flex flex-col justify-center">
          <div className="text-xl md:text-2xl font-bold font-mono text-[var(--text)] mb-1">OWASP</div>
          <div className="text-sm font-medium text-[var(--text-secondary)]">Security-focused detection</div>
        </div>

        <div className="p-8 text-center flex flex-col justify-center border-l lg:border-l-0 border-[var(--border)]">
          <div className="text-xl md:text-2xl font-bold font-mono text-[var(--success)] mb-1">100%</div>
          <div className="text-sm font-medium text-[var(--text-secondary)]">Ownership-gated active scans</div>
        </div>
      </div>
    </section>
  );
}
