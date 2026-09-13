import { X, AlertCircle, ShieldAlert, CheckCircle2, Terminal } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useEffect } from 'react'
import { Finding } from '../../lib/api'
import { SeverityBadge } from '../../components/ui/SeverityBadge'

interface FindingDetailModalProps {
  finding: Finding | null
  onClose: () => void
}

export function FindingDetailModal({ finding, onClose }: FindingDetailModalProps) {
  const { t } = useTranslation()
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (finding) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [finding, onClose])

  if (!finding) return null

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl p-6 md:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 md:top-6 md:right-6 text-[var(--text-muted)] hover:text-[var(--text)] p-2 rounded-lg hover:bg-[var(--surface-2)] transition-colors cursor-pointer"
          aria-label={t('findings.closeDialog')}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-wrap items-center gap-2 mb-4 pr-8">
          <SeverityBadge severity={finding.severity} />
          <span className="px-2 py-0.5 text-[11px] font-bold rounded uppercase tracking-wider bg-[var(--surface-2)] text-[var(--accent)] border border-[var(--border)]">
            {finding.category}
          </span>
          <span className="px-2 py-0.5 text-[11px] font-bold rounded uppercase tracking-wider bg-[var(--surface-2)] text-[var(--text-secondary)] border border-[var(--border)]">
            {t('findings.confidence')} {finding.confidence}
          </span>
          <span className="px-2 py-0.5 text-[11px] font-bold rounded uppercase tracking-wider bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)]">
            {t('findings.method')} {finding.detection_method}
          </span>
        </div>

        <h2 className="text-xl md:text-2xl font-extrabold text-[var(--text)] tracking-tight mb-2">
          {finding.title}
        </h2>

        {/* Endpoint Box */}
        <div className="flex flex-wrap items-center gap-2 p-3 bg-[var(--bg)] border border-[var(--border)] rounded-lg my-6 font-mono text-sm text-[var(--accent)] break-all">
          <span className="px-1.5 py-0.5 rounded bg-[var(--accent)]/10 text-[var(--accent)] text-xs font-bold">
            ENDPOINT
          </span>
          <span>{finding.endpoint}</span>
          {finding.parameter && (
            <span className="ml-auto text-[var(--warning)] font-sans text-xs bg-[var(--warning)]/10 px-2 py-0.5 rounded border border-[var(--warning)]/20">
              Param: <code>{finding.parameter}</code>
            </span>
          )}
        </div>

        {/* Description */}
        <div className="space-y-6 text-sm text-[var(--text-secondary)] leading-relaxed">
          <div>
            <h3 className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)] mb-2">
              Description
            </h3>
            <p className="bg-[var(--surface-2)] p-4 rounded-lg border border-[var(--border)]">
              {finding.description}
            </p>
          </div>

          {/* Evidence */}
          {finding.evidence && Object.keys(finding.evidence).length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Terminal className="w-3.5 h-3.5 text-[var(--accent)]" />
                <h3 className="text-[10px] uppercase tracking-widest font-bold text-[var(--text-muted)]">
                  Vulnerability Evidence (Sanitized)
                </h3>
              </div>
              <pre className="p-4 bg-[var(--bg)] border border-[var(--border)] rounded-lg font-mono text-xs text-[var(--text)] overflow-x-auto whitespace-pre-wrap max-h-56">
                {JSON.stringify(finding.evidence, null, 2)}
              </pre>
            </div>
          )}

          {/* Recommendation */}
          <div>
            <div className="flex items-center gap-1.5 mb-2 text-[var(--success)]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <h3 className="text-[10px] uppercase tracking-widest font-bold">
                Actionable Remediation
              </h3>
            </div>
            <div className="p-4 bg-[var(--success)]/10 border border-[var(--success)]/20 rounded-lg text-[var(--success)] font-medium">
              {finding.recommendation}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-8 pt-4 border-t border-[var(--border)] text-xs text-[var(--text-muted)] font-mono">
          <span>{t('findings.fingerprint')} {finding.fingerprint.slice(0, 16)}...</span>
        </div>
      </div>
    </div>
  )
}
