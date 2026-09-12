import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Shield, Plus, Globe, Activity, Cpu, ArrowRight } from 'lucide-react'
import { listWebsites, Website } from '../../lib/api'
import { useAuth } from '../auth/authState'
import { useTranslation } from 'react-i18next'

export function DashboardPage() {
  const { t } = useTranslation()
  const { signOut } = useAuth()
  const [websites, setWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isMounted = true
    listWebsites()
      .then((items) => {
        if (isMounted) {
          setWebsites(items)
          setError(null)
        }
      })
      .catch((err) => {
        if (isMounted) setError(err instanceof Error ? err.message : 'Failed to load websites.')
      })
      .finally(() => {
        if (isMounted) setLoading(false)
      })
    return () => {
      isMounted = false
    }
  }, [])

  const verifiedCount = websites.filter((w) => w.verification_status === 'VERIFIED').length
  const scoredSites = websites.filter((w) => w.last_score !== null)
  const avgScore = scoredSites.length
    ? Math.round(scoredSites.reduce((acc, curr) => acc + (curr.last_score || 0), 0) / scoredSites.length)
    : null

  if (loading) {
    return (
      <main className="app-shell">
        <p role="status" className="text-slate-400 py-12 text-center text-sm">{t('common.loading')}</p>
      </main>
    )
  }

  return (
    <main className="app-container min-h-screen">
      {/* Console Header */}
      <header className="console-header border-b border-[#27272a] pb-6 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="eyebrow">AUTHORIZED WEB SECURITY SCANNER</p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mt-1">
            ThreatSentry
          </h1>
          <p className="subtitle text-sm text-zinc-400 mt-2">
            Verified target inventory and continuous posture assessment.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/model"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-transparent hover:bg-zinc-900 text-zinc-300 text-sm font-medium border border-zinc-800 transition-colors no-underline"
          >
            <Cpu className="w-4 h-4" />
            <span>{t('navbar.mlIntelligence')}</span>
          </a>
        </div>
      </header>

      {/* Quick Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="glass-card p-5">
          <span className="text-xs font-medium text-zinc-500">Total Assets</span>
          <div className="text-3xl font-semibold text-white mt-2">{websites.length}</div>
          <span className="text-xs text-zinc-500 mt-1 block">Monitored domains</span>
        </div>

        <div className="glass-card p-5">
          <span className="text-xs font-medium text-zinc-500">Verified Ownership</span>
          <div className="text-3xl font-semibold text-white mt-2">{verifiedCount}</div>
          <span className="text-xs text-zinc-500 mt-1 block">Eligible for Deep Scan</span>
        </div>

        <div className="glass-card p-5">
          <span className="text-xs font-medium text-zinc-500">Average Posture Score</span>
          <div className={`text-3xl font-semibold mt-2 ${avgScore !== null ? 'text-white' : 'text-zinc-600'}`}>
            {avgScore !== null ? `${avgScore}` : '—'}
            {avgScore !== null && <span className="text-sm text-zinc-500 font-normal ml-1">/ 100</span>}
          </div>
          <span className="text-xs text-zinc-500 mt-1 block">Across scanned targets</span>
        </div>

        <div className="glass-card p-5">
          <span className="text-xs font-medium text-zinc-500">ML Engine</span>
          <div className="text-3xl font-semibold text-white mt-2">Active</div>
          <span className="text-xs text-zinc-500 mt-1 block">Hybrid detection ready</span>
        </div>
      </div>

      <header className="mb-10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t('dashboard.title')}
            </h1>
            <p className="subtitle mt-1">
              {t('dashboard.monitoredWebsites')} ({websites.length})
            </p>
          </div>
          <Link
            to="/websites/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all focus:ring-2 focus:ring-cyan-500 focus:outline-none"
          >
            <Plus className="w-4 h-4" />
            <span>{t('dashboard.addNewTarget')}</span>
          </Link>
        </div>
      </header>

      {error && (
        <div role="alert" className="mb-8 p-4 rounded-lg bg-rose-950/30 border border-rose-900/50 text-rose-400 text-sm">
          {error}
        </div>
      )}

      {websites.length === 0 && !error ? (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center border-dashed border-[#2a3f5f]">
          <div className="p-4 rounded-full bg-[#111e33] mb-4">
            <Globe className="w-8 h-8 text-cyan-500/50" />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">{t('dashboard.noWebsitesTitle')}</h2>
          <p className="text-slate-400 text-sm max-w-sm mb-6">
            {t('dashboard.noWebsitesDesc')}
          </p>
          <Link
            to="/websites/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#111e33] hover:bg-[#1c2b42] text-cyan-400 font-semibold text-sm border border-[#1c2b42] transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>{t('dashboard.addFirstWebsite')}</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {websites.map((site) => {
            const isVerified = site.verification_status === 'VERIFIED'
            const scoreColor =
              site.last_score === null
                ? 'text-slate-500'
                : site.last_score >= 80
                ? 'text-emerald-400'
                : site.last_score >= 50
                ? 'text-amber-400'
                : 'text-rose-400'

            return (
              <Link
                key={site.id}
                to={`/websites/${site.id}`}
                className="glass-card p-5 hover:border-cyan-500/40 hover:-translate-y-1 transition-all group block no-underline relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-transparent to-transparent group-hover:from-cyan-500/5 pointer-events-none transition-colors" />
                
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 rounded-lg bg-[#111e33] border border-[#1c2b42] group-hover:border-cyan-500/30 transition-colors">
                    <Globe className="w-5 h-5 text-cyan-400" />
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      isVerified
                        ? 'bg-emerald-950/50 text-emerald-400 border border-emerald-900/50'
                        : 'bg-rose-950/50 text-rose-400 border border-rose-900/50'
                    }`}
                  >
                    {site.verification_status}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                  {site.name}
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-1 truncate">
                  {site.normalized_origin}
                </p>

                <div className="mt-6 pt-4 border-t border-[#1c2b42] flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-slate-500" />
                    <span className="text-xs text-slate-400 uppercase font-semibold">Score:</span>
                    <span className={`text-sm font-bold ${scoreColor}`}>
                      {site.last_score !== null ? `${site.last_score}` : 'N/A'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-xs font-semibold text-cyan-400">View</span>
                    <span className="text-cyan-400">&rarr;</span>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </main>
  )
}
