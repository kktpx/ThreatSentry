import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Plus, Globe, Activity, Cpu, ArrowRight } from 'lucide-react'
import { listWebsites, Website } from '../../lib/api'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui/Button'
import { StatCard } from '../../components/ui/StatCard'
import { SecurityScore } from '../../components/ui/SecurityScore'
import { Navbar } from '../../components/Navbar'

export function DashboardPage() {
  const { t } = useTranslation()
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
      <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
        <Navbar />
        <main className="app-container flex items-center justify-center min-h-[calc(100vh-64px)]">
          <p role="status" className="text-[var(--text-muted)] py-12 text-center text-sm font-mono">{t('common.loading')}</p>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navbar />
      <main className="app-container pt-8">
        <header className="mb-10 border-b border-[var(--border)] pb-8">
          <h1 className="text-3xl font-extrabold text-[var(--text)] tracking-tight">
            Security Overview
          </h1>
          <p className="text-[var(--text-secondary)] mt-2 max-w-2xl">
            Monitor verified assets, security posture and recent scans.
          </p>
        </header>

        {/* Quick Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          <StatCard 
            label="Total Targets" 
            value={websites.length} 
          />
          <StatCard 
            label="Verified" 
            value={verifiedCount} 
          />
          <StatCard 
            label="Avg Security Score" 
            value={avgScore !== null ? <SecurityScore score={avgScore} size="md" className="inline-block" /> : '—'} 
          />
          <StatCard 
            label="ML Engine" 
            value={<span className="text-[var(--accent)] flex items-center gap-2"><Cpu className="w-5 h-5" /> Active</span>} 
          />
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-[var(--text)]">
              Your Targets
            </h2>
            <p className="text-sm text-[var(--text-muted)] mt-0.5">
              {websites.length} {websites.length === 1 ? 'asset' : 'assets'} found
            </p>
          </div>
          <Button asChild to="/websites/new" variant="primary">
            <Plus className="w-4 h-4" />
            <span>{t('dashboard.addNewTarget')}</span>
          </Button>
        </div>

        {error && (
          <div role="alert" className="mb-8 p-4 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/30 text-[var(--danger)] text-sm">
            {error}
          </div>
        )}

        {websites.length === 0 && !error ? (
          <div className="glass-card p-12 text-center flex flex-col items-center justify-center border-dashed border-[var(--border-hover)]">
            <div className="w-16 h-16 rounded-full bg-[var(--surface-2)] flex items-center justify-center mb-4">
              <Globe className="w-8 h-8 text-[var(--text-muted)]" />
            </div>
            <h2 className="text-xl font-bold text-[var(--text)] mb-2">{t('dashboard.noWebsitesTitle')}</h2>
            <p className="text-[var(--text-secondary)] text-sm max-w-sm mb-6">
              {t('dashboard.noWebsitesDesc')}
            </p>
            <Button asChild to="/websites/new" variant="secondary">
              <Plus className="w-4 h-4" />
              <span>{t('dashboard.addFirstWebsite')}</span>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {websites.map((site) => {
              const isVerified = site.verification_status === 'VERIFIED'
              
              return (
                <Link
                  key={site.id}
                  to={`/websites/${site.id}`}
                  className="glass-card p-5 group block no-underline relative overflow-hidden"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] group-hover:border-[var(--accent)]/30 transition-colors">
                        <Globe className="w-5 h-5 text-[var(--text-muted)] group-hover:text-[var(--accent)] transition-colors" />
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-[var(--text)] truncate group-hover:text-[var(--accent)] transition-colors">
                          {site.name}
                        </h3>
                        <p className="text-xs text-[var(--text-muted)] font-mono truncate">
                          {site.normalized_origin}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-[var(--border)] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${isVerified ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'}`} />
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[var(--text-secondary)]">
                          {site.verification_status}
                        </span>
                      </div>
                      <div className="w-px h-3 bg-[var(--border)]" />
                      <SecurityScore score={site.last_score} size="sm" />
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--accent)]">
                      <span className="text-[10px] font-bold uppercase tracking-wider">View</span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
