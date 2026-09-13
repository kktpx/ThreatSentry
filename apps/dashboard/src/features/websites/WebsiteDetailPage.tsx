import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import {
  ShieldCheck,
  AlertTriangle,
  Play,
  Square,
  Globe,
  Layers,
  Activity,
  ArrowLeft,
  ChevronRight,
  Trash2,
  CheckCircle2,
  ShieldAlert
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
import { getScanStatusLabel } from '../../lib/i18nHelpers'
import { Button } from '../../components/ui/Button'
import { SecurityScore } from '../../components/ui/SecurityScore'
import { SeverityBadge } from '../../components/ui/SeverityBadge'
import { Badge } from '../../components/ui/Badge'
import { Navbar } from '../../components/Navbar'

export function WebsiteDetailPage() {
  const { t } = useTranslation()
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [website, setWebsite] = useState<Website | null>(null)
  const [scans, setScans] = useState<ScanJob[]>([])
  const [findings, setFindings] = useState<Finding[]>([])
  const [selectedFinding, setSelectedFinding] = useState<Finding | null>(null)
  const [activeTab, setActiveTab] = useState<'findings' | 'surface' | 'history'>('findings')
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
        setVerifyMessage(t('websiteDetail.verifySuccess'))
      } else {
        setActionError(t('websiteDetail.verifyFailedChallenge'))
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('websiteDetail.verifyError'))
    } finally {
      setVerifying(false)
    }
  }

  async function handleDelete() {
    if (!id) return
    if (!window.confirm(t('websiteDetail.deleteConfirm', { name: website?.name || 'this website' }))) {
      return
    }
    setDeleting(true)
    try {
      await deleteWebsite(id)
      navigate('/dashboard')
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('websiteDetail.deleteError'))
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
          setError(err instanceof Error ? err.message : t('websiteDetail.loadError'))
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
      setActionError(err instanceof Error ? err.message : t('websiteDetail.scanStartError'))
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
      setActionError(err instanceof Error ? err.message : t('websiteDetail.scanCancelError'))
    } finally {
      setCancellingScanId(null)
    }
  }

  if (loading) {
    return (
      <main className="app-container">
        <p role="status" className="text-[var(--text-muted)] py-12 text-center text-sm font-mono">
          Loading target...
        </p>
      </main>
    )
  }

  if (error || !website) {
    return (
      <main className="app-container">
        <Link to="/dashboard" className="text-[var(--accent)] hover:underline mb-4 inline-flex items-center gap-1.5 text-sm">
          <ArrowLeft className="w-4 h-4" />
          <span>&larr; Back to Dashboard</span>
        </Link>
        <p role="alert" className="text-[var(--danger)] mt-4 p-4 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/30">
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

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navbar />
      <main className="app-container pt-8">
        <Link to="/dashboard" className="text-[var(--accent)] hover:underline mb-8 inline-flex items-center gap-1.5 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" />
          <span>{t('websiteDetail.backToDashboard')}</span>
        </Link>

      <header className="mb-10">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <h1 className="text-3xl font-extrabold text-[var(--text)] tracking-tight">
                {website.name}
              </h1>
              {isVerified ? (
                <Badge variant="success"><CheckCircle2 className="w-3 h-3" /> Verified</Badge>
              ) : (
                <Badge variant="danger"><AlertTriangle className="w-3 h-3" /> Unverified</Badge>
              )}
            </div>
            
            <a 
              href={website.normalized_origin} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-mono text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors no-underline"
            >
              <Globe className="w-3.5 h-3.5" />
              {website.normalized_origin}
            </a>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right mr-2">
              <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1">{t('websiteDetail.score')}</div>
              <SecurityScore score={website.last_score} size="lg" />
            </div>

            <div className="h-12 w-px bg-[var(--border)] hidden sm:block" />

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {isVerified ? (
                <Button
                  onClick={() => void handleStartScan()}
                  disabled={startingScan || !!activeScan}
                  variant="primary"
                  icon={Play}
                >
                  {startingScan ? t('websiteDetail.starting') : activeScan ? t('websiteDetail.scanning') : t('websiteDetail.startScan')}
                </Button>
              ) : (
                <Button
                  onClick={() => void handleVerify()}
                  disabled={verifying}
                  variant="primary"
                  icon={ShieldCheck}
                >
                  {verifying ? t('addWebsite.verifying') : t('websiteDetail.verifyTarget')}
                </Button>
              )}
              <Button
                onClick={() => void handleDelete()}
                disabled={deleting}
                variant="secondary"
                icon={Trash2}
                className="text-[var(--text-muted)] hover:text-[var(--danger)] hover:border-[var(--danger)]"
                title={t('websiteDetail.deleteTarget')}
              >
                {t('common.delete')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {verifyMessage && (
        <div role="status" className="mb-8 p-4 rounded-lg bg-[var(--success)]/10 border border-[var(--success)]/30 text-[var(--success)] text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{verifyMessage}</span>
        </div>
      )}

      {actionError && (
        <div role="alert" className="mb-8 p-4 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {!isVerified && (
        <div className="mb-8 p-6 glass-card bg-[var(--warning)]/5 border-[var(--warning)]/30">
          <h3 className="text-sm font-bold text-[var(--warning)] mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Ownership Verification Required
          </h3>
          <p className="text-sm text-[var(--text-secondary)] mb-4">
            {t('websiteDetail.ownershipDesc')}
          </p>
          <div className="bg-[var(--surface-2)] p-4 rounded border border-[var(--border)] font-mono text-xs mb-4">
            <div className="mb-2">
              <span className="text-[var(--text-muted)] inline-block w-20">{t('websiteDetail.path')}</span>
              <span className="text-[var(--accent)]">{website.normalized_origin}/.well-known/threatsentry.txt</span>
            </div>
            <div>
              <span className="text-[var(--text-muted)] inline-block w-20">{t('websiteDetail.content')}</span>
              <span className="text-[var(--warning)]">threatsentry-verification={website.verification_token}</span>
            </div>
          </div>
          
          <div className="text-xs text-[var(--text-muted)] bg-[var(--surface-2)] p-4 rounded border border-[var(--border)] leading-relaxed space-y-2 mb-4">
            <p><strong>Tip:</strong> {t('addWebsite.folderTip').split('. ')[0] + '.'} <code className="bg-[var(--bg)] border border-[var(--border)] px-1 py-0.5 rounded font-mono text-[11px] text-[var(--text)]">.well-known</code> in your web server's public root directory (e.g., <code className="bg-[var(--bg)] border border-[var(--border)] px-1 py-0.5 rounded font-mono text-[11px] text-[var(--text)]">public/</code>, <code className="bg-[var(--bg)] border border-[var(--border)] px-1 py-0.5 rounded font-mono text-[11px] text-[var(--text)]">htdocs/</code>, or <code className="bg-[var(--bg)] border border-[var(--border)] px-1 py-0.5 rounded font-mono text-[11px] text-[var(--text)]">var/www/html/</code>).  {t('addWebsite.folderTip').split('. ')[1]} <code className="bg-[var(--bg)] border border-[var(--border)] px-1 py-0.5 rounded font-mono text-[11px] text-[var(--text)]">threatsentry.txt</code> file inside it.</p>
          </div>

          <div className="text-xs text-[var(--text-muted)] bg-[var(--surface-2)] p-4 rounded border border-[var(--border)] leading-relaxed space-y-2">
            <span className="font-semibold uppercase text-[var(--text-secondary)] block mb-1.5">{t('addWebsite.deployStep')}</span>
            <p>{t('addWebsite.deployDesc')}</p>
            <code className="block bg-[var(--bg)] p-2 rounded border border-[var(--border)] font-mono text-[11px] text-[var(--accent)]">
              git add public/.well-known/threatsentry.txt<br/>
              git commit -m "Add verification file"<br/>
              git push
            </code>
            <p>{t('addWebsite.deployWait')}</p>
          </div>
        </div>
      )}

      {activeScan && (
        <div className="mb-8 p-6 glass-card border-[var(--accent)] bg-[var(--accent)]/5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div>
              <div className="text-[10px] uppercase font-bold tracking-widest text-[var(--accent)] mb-1">{t('websiteDetail.scanInProgress')}</div>
              <h3 className="text-xl font-bold text-[var(--text)]">{t('websiteDetail.stage')} {activeScan.current_stage}</h3>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-2xl font-mono font-bold text-[var(--text)]">
                {activeScan.progress}%
              </span>
              <Button
                onClick={() => void handleCancelScan(activeScan.id)}
                disabled={cancellingScanId === activeScan.id}
                variant="danger"
                size="sm"
                icon={Square}
              >
                {cancellingScanId === activeScan.id ? t('common.cancel') : t('common.cancel')}
              </Button>
            </div>
          </div>
          <div className="w-full bg-[var(--surface-2)] h-2 rounded-full overflow-hidden border border-[var(--border)]">
            <div
              className="bg-[var(--accent)] h-full rounded-full transition-all duration-300 ease-out"
              style={{ width: `${Math.max(activeScan.progress, 5)}%` }}
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-[var(--border)] mb-8 flex gap-6 font-semibold text-sm">
        <button 
          onClick={() => setActiveTab('findings')}
          className={`pb-4 cursor-pointer transition-colors bg-transparent border-none p-0 ${activeTab === 'findings' ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--text)]'}`}
        >
          Findings <span className="ml-1 text-xs bg-[var(--surface-2)] px-1.5 py-0.5 rounded font-mono font-normal">{findings.length}</span>
        </button>
        <button 
          onClick={() => setActiveTab('surface')}
          className={`pb-4 cursor-pointer transition-colors bg-transparent border-none p-0 ${activeTab === 'surface' ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--text)]'}`}
        >
          Attack Surface
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`pb-4 cursor-pointer transition-colors bg-transparent border-none p-0 ${activeTab === 'history' ? 'text-[var(--accent)] border-b-2 border-[var(--accent)]' : 'text-[var(--text-secondary)] hover:text-[var(--text)]'}`}
        >
          History
        </button>
      </div>

      {activeTab === 'findings' && (
        <section className="animate-in fade-in">
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mr-2">{t('websiteDetail.severityFilter')}</span>
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSelectedSeverity(sev)}
                className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer border ${
                  selectedSeverity === sev
                    ? 'bg-[var(--text)] text-[var(--bg)] border-[var(--text)]'
                    : 'bg-[var(--surface-2)] text-[var(--text-secondary)] hover:text-[var(--text)] border-[var(--border)]'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>

          {filteredFindings.length === 0 ? (
            <div className="glass-card p-12 text-center border-dashed">
              <ShieldCheck className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-4" />
              <h4 className="text-lg font-bold text-[var(--text)] mb-2">{t('websiteDetail.noFindings')}</h4>
              <p className="text-sm text-[var(--text-secondary)]">
                {findings.length === 0
                  ? t('websiteDetail.noFindingsDesc')
                  : t('websiteDetail.noFindingsFilter', { severity: selectedSeverity })}
              </p>
            </div>
          ) : (
            <div className="glass-card overflow-hidden">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[var(--surface-2)] border-b border-[var(--border)] text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  <tr>
                    <th className="p-4 font-semibold">Severity</th>
                    <th className="p-4 font-semibold">{t('websiteDetail.colFinding')}</th>
                    <th className="p-4 font-semibold">{t('websiteDetail.colEndpoint')}</th>
                    <th className="p-4 font-semibold">{t('websiteDetail.colCategory')}</th>
                    <th className="p-4 font-semibold">{t('websiteDetail.colConfidence')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {filteredFindings.map((finding) => (
                    <tr 
                      key={finding.id} 
                      onClick={() => setSelectedFinding(finding)}
                      className="hover:bg-[var(--surface-2)] cursor-pointer transition-colors group"
                    >
                      <td className="p-4"><SeverityBadge severity={finding.severity} /></td>
                      <td className="p-4 font-bold text-[var(--text)] group-hover:text-[var(--accent)] transition-colors">
                        {finding.title}
                        {finding.status === 'NEW' && <Badge className="ml-2">{t('websiteDetail.new')}</Badge>}
                      </td>
                      <td className="p-4 font-mono text-xs text-[var(--text-secondary)] truncate max-w-[200px]">{finding.endpoint}</td>
                      <td className="p-4 text-xs font-mono text-[var(--text-secondary)]">{finding.category}</td>
                      <td className="p-4 text-xs font-mono text-[var(--text-secondary)]">{finding.confidence}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {activeTab === 'surface' && (
        <section className="animate-in fade-in">
          {!attackSurface ? (
            <div className="glass-card p-12 text-center text-[var(--text-secondary)] text-sm">
              No attack surface data available. Complete a scan first.
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="glass-card p-5">
                  <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1">{t('websiteDetail.pagesCrawled')}</div>
                  <div className="text-3xl font-bold font-mono text-[var(--text)]">
                    {attackSurface.pages_crawled_count || 0}
                  </div>
                </div>
                <div className="glass-card p-5">
                  <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1">{t('websiteDetail.endpoints')}</div>
                  <div className="text-3xl font-bold font-mono text-[var(--text)]">
                    {attackSurface.endpoints_count || 0}
                  </div>
                </div>
                <div className="glass-card p-5">
                  <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1">{t('websiteDetail.forms')}</div>
                  <div className="text-3xl font-bold font-mono text-[var(--text)]">
                    {attackSurface.forms_count || 0}
                  </div>
                </div>
                <div className="glass-card p-5">
                  <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1">{t('websiteDetail.external')}</div>
                  <div className="text-3xl font-bold font-mono text-[var(--text)]">
                    {attackSurface.external_domains_count || 0}
                  </div>
                </div>
              </div>

              {attackSurface.pages_crawled && attackSurface.pages_crawled.length > 0 && (
                <div className="glass-card overflow-hidden">
                  <div className="bg-[var(--surface-2)] border-b border-[var(--border)] px-4 py-3 text-xs uppercase font-bold tracking-wider text-[var(--text-muted)]">
                    {t('websiteDetail.crawledPages')}
                  </div>
                  <ul className="divide-y divide-[var(--border)] text-xs font-mono text-[var(--text-secondary)] max-h-96 overflow-y-auto m-0 p-0 list-none">
                    {attackSurface.pages_crawled.map((url, idx) => (
                      <li key={idx} className="p-3 hover:bg-[var(--surface-2)] transition-colors truncate">
                        {url}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </section>
      )}

      {activeTab === 'history' && (
        <section className="animate-in fade-in">
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[var(--surface-2)] border-b border-[var(--border)] text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  <tr>
                    <th className="p-4 font-semibold">{t('websiteDetail.colDate')}</th>
                    <th className="p-4 font-semibold">{t('websiteDetail.colStatus')}</th>
                    <th className="p-4 font-semibold">{t('websiteDetail.colStage')}</th>
                    <th className="p-4 font-semibold">{t('websiteDetail.colScore')}</th>
                    <th className="p-4 font-semibold">{t('websiteDetail.colFindings')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] text-[var(--text-secondary)]">
                  {scans.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-[var(--text-muted)]">
                        {t('websiteDetail.noScans')}
                      </td>
                    </tr>
                  ) : (
                    scans.map((scan) => (
                      <tr key={scan.id} className="hover:bg-[var(--surface-2)] transition-colors">
                        <td className="p-4 font-mono text-xs">
                          {new Date(scan.created_at).toLocaleString()}
                        </td>
                        <td className="p-4">
                          <Badge variant={scan.status === 'COMPLETED' ? 'success' : scan.status === 'FAILED' ? 'danger' : scan.status === 'CANCELLED' ? 'default' : 'warning'}>
                            {getScanStatusLabel(scan.status)}
                          </Badge>
                        </td>
                        <td className="p-4 font-mono text-xs">{scan.current_stage}</td>
                        <td className="p-4 font-bold font-mono">
                          {scan.score !== null && scan.score !== undefined ? `${scan.score}/100` : '—'}
                        </td>
                        <td className="p-4 font-mono text-xs">
                          {scan.summary?.findings_count !== undefined
                            ? `${scan.summary.findings_count}`
                            : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      <FindingDetailModal
        finding={selectedFinding}
        onClose={() => setSelectedFinding(null)}
      />
    </main>
    </div>
  )
}
