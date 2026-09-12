import { X, AlertCircle, ShieldAlert, CheckCircle2, Terminal } from 'lucide-react'
import { Finding } from '../../lib/api'

interface FindingDetailModalProps {
  finding: Finding | null
  onClose: () => void
}

export function FindingDetailModal({ finding, onClose }: FindingDetailModalProps) {
  if (!finding) return null

  const getSeverityBadgeClass = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'badge-critical'
      case 'HIGH':
        return 'badge-high'
      case 'MEDIUM':
        return 'badge-medium'
      case 'LOW':
        return 'badge-low'
      default:
        return 'badge-info'
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-[#0c1524] border border-[#2a3f5f] rounded-xl shadow-2xl p-6 sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#111e33] transition-colors cursor-pointer"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-wrap items-center gap-2.5 mb-4">
          <span className={`px-2.5 py-0.5 text-xs font-bold rounded-md uppercase tracking-wider ${getSeverityBadgeClass(finding.severity)}`}>
            {finding.severity}
          </span>
          <span className="px-2.5 py-0.5 text-xs font-medium rounded-md bg-[#111e33] text-cyan-300 border border-[#1c2b42]">
            {finding.category}
          </span>
          <span className="px-2.5 py-0.5 text-xs font-medium rounded-md bg-[#111e33] text-slate-300 border border-[#1c2b42]">
            Confidence: {finding.confidence}
          </span>
          <span className="px-2.5 py-0.5 text-xs font-medium rounded-md bg-[#111e33] text-slate-400 border border-[#1c2b42]">
            Method: {finding.detection_method}
          </span>
        </div>

        <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight mb-2">
          {finding.title}
        </h2>

        {/* Endpoint Box */}
        <div className="flex items-center gap-2 p-3 bg-[#070d18] border border-[#1c2b42] rounded-lg my-4 font-mono text-xs sm:text-sm text-cyan-300 break-all">
          <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 text-xs font-bold">
            ENDPOINT
          </span>
          <span>{finding.endpoint}</span>
          {finding.parameter && (
            <span className="ml-auto text-amber-300 font-sans text-xs bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
              Param: <code>{finding.parameter}</code>
            </span>
          )}
        </div>

        {/* Description */}
        <div className="space-y-4 my-6 text-sm text-slate-300 leading-relaxed">
          <div>
            <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-400 mb-1.5">
              Description
            </h3>
            <p className="bg-[#111e33]/50 p-3.5 rounded-lg border border-[#1c2b42]">
              {finding.description}
            </p>
          </div>

          {/* Evidence */}
          {finding.evidence && Object.keys(finding.evidence).length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <h3 className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                  Vulnerability Evidence (Sanitized)
                </h3>
              </div>
              <pre className="p-3.5 bg-[#040810] border border-[#1c2b42] rounded-lg font-mono text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap max-h-56">
                {JSON.stringify(finding.evidence, null, 2)}
              </pre>
            </div>
          )}

          {/* Recommendation */}
          <div>
            <div className="flex items-center gap-2 mb-1.5 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <h3 className="text-xs uppercase tracking-wider font-semibold">
                Actionable Remediation
              </h3>
            </div>
            <div className="p-3.5 bg-emerald-950/20 border border-emerald-900/40 rounded-lg text-emerald-200">
              {finding.recommendation}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-[#1c2b42] text-xs text-slate-500 font-mono">
          <span>Fingerprint: {finding.fingerprint.slice(0, 16)}...</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#111e33] hover:bg-[#1c2b42] text-white font-medium rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
