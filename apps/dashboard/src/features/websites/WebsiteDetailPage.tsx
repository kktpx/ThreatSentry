import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Play,
  Square,
  Globe,
  Layers,
  FileText,
  Activity,
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Info,
  Trash2,
  CheckCircle2,
} from 'lucide-react'

import {
  cancelScan,
  deleteWebsite,
  getWebsite,
  listFindingsForWebsite,
  listScansForWebsite,
  Finding,
  ScanJob,
  startScan,
  verifyWebsite,
  Website,
} from '../../lib/api'
import { FindingDetailModal } from '../findings/FindingDetailModal'

export function WebsiteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [website, setWebsite] = useState<Website | null>(null)
  const [scans, setScans] = useState<ScanJob[]>([])
  const [findings, setFindings] = useState<Finding[]>([])
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null)
  const [activeTab, setActiveTab] = useState<'findings' | 'history' | 'surface'>('findings')
  const [selectedSeverity, setSelectedSeverity] = useState<string>('ALL')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [startingScan, setStartingScan] = useState(false)
  const [cancellingScanId, setCancellingScanId] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [verifyMessage, setVerifyMessage] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  async function handleVerify() {
    if (!id) return
    setVerifying(true)
    setActionError(null)
    setVerifyMessage(null)
    try {
      const updated = await verifyWebsite(id)
      setWebsite((prev) => (prev ? { ...prev, ...updated } : updated))
      if (updated.verification_status === 'VERIFIED') {
        setVerifyMessage('Ownership verified successfully! You can now start deep scans.')
      } else {
        setActionError('Verification challenge could not be confirmed. Check target availability and try again.')
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to verify website.')
    } finally {
      setVerifying(false)
    }
  }

  async function handleDelete() {
    if (!id) return
    if (!window.confirm(`Are you sure you want to delete '${website?.name || 'this website'}'? This cannot be undone.`)) {
      return
    }
    setDeleting(true)
    try {
      await deleteWebsite(id)
      navigate('/dashboard')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete website.')
      setDeleting(false)
    }
  }

  useEffect(() => {
    if (!id) return

    let isMounted = true

    async function loadData() {
      try {
        const [siteData, scansData, findingsData] = await Promise.all([
          getWebsite(id!),
          listScansForWebsite(id!),
          listFindingsForWebsite(id!).catch(() => []),
        ])
        if (isMounted) {
          setWebsite(siteData)
          setScans(scansData)
          setFindings(findingsData)
          setError(null)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load website details.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void loadData()

    return () => {
      isMounted = false
    }
  }, [id])

  // Setup polling if any scan is PENDING or RUNNING
  const activeScan = scans.find(
    (s) => s.status === 'PENDING' || s.status === 'RUNNING'
  )

  useEffect(() => {
    if (!id || !activeScan) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
      return
    }

    pollingRef.current = setInterval(() => {
      void listScansForWebsite(id)
        .then((updatedScans) => {
          setScans(updatedScans)
          const stillActive = updatedScans.some(
            (s) => s.status === 'PENDING' || s.status === 'RUNNING'
          )
          if (!stillActive) {
            void getWebsite(id).then(setWebsite).catch(() => {})
            void listFindingsForWebsite(id).then(setFindings).catch(() => {})
          }
        })
        .catch(() => {})
    }, 1500)

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current)
        pollingRef.current = null
      }
    }
  }, [id, activeScan?.id, activeScan?.status])

  async function handleStartScan() {
    if (!id) return
    setStartingScan(true)
    setActionError(null)
    try {
      const newScan = await startScan(id)
      setScans((prev) => [newScan, ...prev])
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to start scan.')
    } finally {
      setStartingScan(false)
    }
  }

  async function handleCancelScan(scanId: string) {
    setCancellingScanId(scanId)
    setActionError(null)
    try {
      const cancelled = await cancelScan(scanId)
      setScans((prev) =>
        prev.map((s) => (s.id === scanId ? { ...s, ...cancelled } : s))
      )
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to cancel scan.')
    } finally {
      setCancellingScanId(null)
    }
  }

  if (loading) {
    return (
      <main className="app-shell">
        <p role="status" className="text-slate-400 py-12 text-center text-sm">
          Loading website details...
        </p>
      </main>
    )
  }

  if (error || !website) {
    return (
      <main className="app-shell">
        <Link to="/dashboard" className="text-cyan-400 hover:underline mb-4 inline-flex items-center gap-1.5 text-sm">
          <ArrowLeft className="w-4 h-4" />
          <span>&larr; Back to Dashboard</span>
        </Link>
        <p role="alert" className="text-rose-400 mt-4 p-4 rounded-lg bg-rose-950/30 border border-rose-900/50">
          {error || 'Website not found.'}
        </p>
      </main>
    )
  }

  const isVerified = website.verification_status === 'VERIFIED'
  const latestCompletedScan = scans.find((s) => s.status === 'COMPLETED')
  const attackSurface = latestCompletedScan?.summary?.attack_surface

  const filteredFindings = findings.filter((f) => {
    if (selectedSeverity === 'ALL') return true
    return f.severity === selectedSeverity
  })

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
    <main className="app-container min-h-screen">
      {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link
            to="/dashboard"
            className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1.5 text-sm font-medium no-underline transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
        </div>

        {/* Header Console */}
        <header className="console-header glass-card p-6 sm:p-8 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <span className="eyebrow">STATUS:</span>
                <span
                  className={`text-xs font-bold px-3 py-0.5 rounded-full uppercase tracking-wider ${
                    isVerified
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-rose-950 text-rose-400 border border-rose-800'
                  }`}
                >
                  {website.verification_status}
                </span>
                <span className="text-xs text-slate-400 font-mono bg-[#111e33] px-2.5 py-0.5 rounded border border-[#1c2b42]">
                  Asset ID: {website.id.slice(0, 8)}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {website.name}
              </h1>
              <p className="subtitle font-mono text-xs sm:text-sm text-cyan-300/80 mt-1">
                {website.normalized_origin}
              </p>
            </div>

            {/* Score & Action Button */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="p-3 bg-[#070d18] border border-[#1c2b42] rounded-lg text-right">
                <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                  Security Score
                </span>
                <strong className="text-lg sm:text-xl font-bold text-white">
                  {website.last_score === null ? 'Not scanned' : `${website.last_score} / 100`}
                </strong>
              </div>

              <div className="flex items-center gap-3">
                {isVerified ? (
                  <button
                    type="button"
                    onClick={() => void handleStartScan()}
                    disabled={startingScan || !!activeScan}
                    className={`flex items-center gap-2 px-5 py-3 rounded-lg font-bold text-sm transition-all cursor-pointer ${
                      startingScan || activeScan
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                        : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/20'
                    }`}
                  >
                    <Play className="w-4 h-4 fill-current" />
                    <span>{startingScan ? 'Starting Scan...' : activeScan ? 'Scan in Progress' : 'Start Deep Scan'}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void handleVerify()}
                    disabled={verifying}
                    className="flex items-center gap-2 px-5 py-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{verifying ? 'Verifying...' : 'Verify Now'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => void handleDelete()}
                  disabled={deleting}
                  className="p-3 rounded-lg bg-[#111e33] hover:bg-rose-950/40 text-slate-400 hover:text-rose-400 border border-[#1c2b42] hover:border-rose-900/50 transition-all cursor-pointer"
                  title="Delete Target"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {verifyMessage && (
            <div role="status" className="mt-4 p-3 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{verifyMessage}</span>
            </div>
          )}

          {actionError && (
            <div role="alert" className="mt-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-sm">
              {actionError}
            </div>
          )}

          {!isVerified && (
            <div className="mt-6 p-5 rounded-lg bg-amber-950/20 border border-amber-900/50">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold text-amber-400 mb-1 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    <span>Ownership Verification Required</span>
                  </h3>
                  <p className="text-xs text-slate-300">
                    Deep security scans can only be performed on websites whose ownership has been verified via <code>/.well-known/threatsentry.txt</code>.
                  </p>
                  <div className="mt-3 bg-[#070d18] p-3 rounded border border-[#1c2b42] text-xs font-mono space-y-1">
                    <p className="text-slate-400">Challenge URL: <span className="text-cyan-400">{website.normalized_origin}/.well-known/threatsentry.txt</span></p>
                    <p className="text-slate-400">File Content: <span className="text-emerald-400">threatsentry-verification={website.verification_token || '...'}</span></p>
                  </div>
                </div>

                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => void handleVerify()}
                    disabled={verifying}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer disabled:opacity-50"
                  >
                    <ShieldCheck className="w-4 h-4" />
                    <span>{verifying ? 'Verifying...' : 'Verify Ownership Now'}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </header>

        {/* Active Scan Banner */}
        {activeScan && (
          <div className="glass-card p-6 mb-8 border-cyan-500/60 bg-cyan-950/10 shadow-cyan-950/30">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <div>
                <p className="eyebrow text-cyan-400">ACTIVE SCAN IN PROGRESS</p>
                <h3 className="text-xl font-bold text-white mt-1">Stage: {activeScan.current_stage}</h3>
                <span className="text-xs text-slate-400 font-mono">
                  Started: {activeScan.started_at ? new Date(activeScan.started_at).toLocaleTimeString() : 'Just now'}
                </span>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-2xl font-mono font-bold text-cyan-400">
                  {activeScan.progress}%
                </span>
                <button
                  type="button"
                  onClick={() => void handleCancelScan(activeScan.id)}
                  disabled={cancellingScanId === activeScan.id}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-950 hover:bg-rose-900 text-rose-300 text-xs font-bold border border-rose-800 transition-colors cursor-pointer"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>{cancellingScanId === activeScan.id ? 'Cancelling...' : 'Cancel Scan'}</span>
                </button>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-[#070d18] h-2.5 rounded-full overflow-hidden border border-[#1c2b42]">
              <div
                className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-300 ease-out"
                style={{ width: `${Math.max(activeScan.progress, 5)}%` }}
              />
            </div>
          </div>
        )}

        {/* Section: Findings */}
        <section className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
              <span>Vulnerability Findings ({findings.length})</span>
            </h3>
          </div>
            {/* Severity Filter */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="text-xs uppercase font-semibold text-slate-500 mr-1">Filter Severity:</span>
              {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map((sev) => (
                <button
                  key={sev}
                  onClick={() => setSelectedSeverity(sev)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold uppercase tracking-wider transition-colors cursor-pointer ${
                    selectedSeverity === sev
                      ? 'bg-cyan-500 text-slate-950'
                      : 'bg-[#111e33] text-slate-400 hover:text-white border border-[#1c2b42]'
                  }`}
                >
                  {sev}
                </button>
              ))}
            </div>

            {filteredFindings.length === 0 ? (
              <div className="glass-card p-10 text-center text-slate-400">
                <ShieldCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2 opacity-80" />
                <h4 className="text-base font-bold text-white">No Findings Detected</h4>
                <p className="text-xs text-slate-500 mt-1">
                  {findings.length === 0
                    ? 'Start a Deep Scan to run automated passive and active vulnerability testing.'
                    : `No findings matching severity '${selectedSeverity}'.`}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {filteredFindings.map((finding) => (
                  <div
                    key={finding.id}
                    onClick={() => setSelectedFinding(finding)}
                    className="glass-card p-4 sm:p-5 hover:border-cyan-500/40 cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 group"
                  >
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`px-2 py-0.5 text-[11px] font-bold rounded uppercase tracking-wider ${getSeverityBadgeClass(finding.severity)}`}>
                          {finding.severity}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {finding.category}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-[#111e33] text-slate-300 border border-[#1c2b42]">
                          {finding.status}
                        </span>
                        <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-cyan-950/40 text-cyan-300 border border-cyan-800/40">
                          {finding.confidence}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                        {finding.title}
                      </h4>
                      <div className="text-xs font-mono text-slate-400 truncate">
                        <code>{finding.endpoint}</code>
                        {finding.parameter && (
                          <span className="ml-2 text-amber-300 font-sans">
                            param: <code>{finding.parameter}</code>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-medium group-hover:translate-x-1 transition-transform shrink-0">
                      <span>View evidence</span>
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}
        </section>

        {/* Section: Attack Surface */}
        {attackSurface && (
          <section className="mb-10">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-cyan-400" />
              <span>Attack Surface</span>
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass-card p-4">
                  <span className="text-xs uppercase font-semibold text-slate-400">Pages Crawled</span>
                  <div className="text-2xl font-bold text-white mt-1">
                    {attackSurface.pages_crawled_count || 0}
                  </div>
                </div>
                <div className="glass-card p-4">
                  <span className="text-xs uppercase font-semibold text-slate-400">Discovered Endpoints</span>
                  <div className="text-2xl font-bold text-white mt-1">
                    {attackSurface.endpoints_count || 0}
                  </div>
                </div>
                <div className="glass-card p-4">
                  <span className="text-xs uppercase font-semibold text-slate-400">Discovered Forms</span>
                  <div className="text-2xl font-bold text-white mt-1">
                    {attackSurface.forms_count || 0}
                  </div>
                </div>
                <div className="glass-card p-4">
                  <span className="text-xs uppercase font-semibold text-slate-400">External Domains</span>
                  <div className="text-2xl font-bold text-white mt-1">
                    {attackSurface.external_domains_count || 0}
                  </div>
                </div>
              </div>

              {attackSurface.pages_crawled && attackSurface.pages_crawled.length > 0 && (
                <div className="glass-card p-5">
                  <h4 className="text-sm font-bold text-white mb-3">Crawled Page URLs</h4>
                  <ul className="divide-y divide-[#1c2b42] text-xs font-mono text-slate-300 max-h-60 overflow-y-auto">
                    {attackSurface.pages_crawled.map((url, idx) => (
                      <li key={idx} className="py-2 truncate">
                        {url}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Section: Scan History */}
        <section className="mb-10">
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-cyan-400" />
            <span>Scan History ({scans.length})</span>
          </h3>
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-[#111e33] text-slate-400 uppercase tracking-wider text-xs border-b border-[#1c2b42]">
                  <tr>
                    <th className="p-4">Scan Date</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Stage</th>
                    <th className="p-4">Score</th>
                    <th className="p-4">Findings</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c2b42] text-slate-300">
                  {scans.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500">
                        No scans recorded yet.
                      </td>
                    </tr>
                  ) : (
                    scans.map((scan) => (
                      <tr key={scan.id} className="hover:bg-[#0e192c] transition-colors">
                        <td className="p-4 font-mono text-xs text-slate-400">
                          {new Date(scan.created_at).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                              scan.status === 'COMPLETED'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : scan.status === 'FAILED'
                                ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                : scan.status === 'CANCELLED'
                                ? 'bg-slate-800 text-slate-400 border border-slate-700'
                                : 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                            }`}
                          >
                            {scan.status}
                          </span>
                        </td>
                        <td className="p-4 font-mono text-xs">{scan.current_stage}</td>
                        <td className="p-4 font-bold text-white">
                          {scan.score !== null && scan.score !== undefined ? `${scan.score} / 100` : '—'}
                        </td>
                        <td className="p-4 text-xs text-slate-400">
                          {scan.summary?.findings_count !== undefined
                            ? `${scan.summary.findings_count} issues`
                            : '—'}
                        </td>
                        <td className="p-4 text-right">
                          {scan.status === 'RUNNING' && (
                            <button
                              onClick={() => void handleCancelScan(scan.id)}
                              className="text-xs text-rose-400 hover:underline font-semibold cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Finding Detail Modal */}
        <FindingDetailModal
          finding={selectedFinding}
          onClose={() => setSelectedFinding(null)}
        />
      </main>
  )
}
