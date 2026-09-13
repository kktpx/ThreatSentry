import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { Shield, Globe, Activity, Plus } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { Website } from '../../lib/api'
import { Navbar } from '../../components/Navbar'
import { StatCard } from '../../components/ui/StatCard'
import { SecurityScore } from '../../components/ui/SecurityScore'
import { Button } from '../../components/ui/Button'
import { SectionHeader } from '../../components/ui/SectionHeader'
import { useTranslation } from 'react-i18next'

export function DashboardPage() {
  const [websites, setWebsites] = useState<Website[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { t } = useTranslation()

  useEffect(() => {
    async function loadWebsites() {
      try {
        const { data, error } = await supabase
          .from('websites')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) throw error
        setWebsites(data || [])
      } catch (err: any) {
        setError(t('dashboard.failedToLoad'))
      } finally {
        setLoading(false)
      }
    }

    loadWebsites()
  }, [t])

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg)]">
        <Navbar />
        <div className="flex items-center justify-center h-[calc(100vh-64px)]">
          <div className="animate-pulse flex items-center gap-2 text-[var(--accent)] font-mono text-sm">
            <Shield className="w-5 h-5" />
            {t('common.loading')}
          </div>
        </div>
      </div>
    )
  }

  const verifiedCount = websites.filter(w => w.verification_status === 'VERIFIED').length
  const avgScore = websites.length > 0 
    ? Math.round(websites.reduce((acc, w) => acc + (w.last_score || 0), 0) / websites.length)
    : 0

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      <main className="app-container pt-8">
        <SectionHeader 
          title={t('dashboard.title')}
          description={t('dashboard.subtitle')}
        />

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/20 text-[var(--danger)] text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard 
            label={t('dashboard.totalTargets')}
            value={websites.length} 
            icon={<Globe className="w-5 h-5" />} 
          />
          <StatCard 
            label={t('dashboard.verified')}
            value={verifiedCount} 
            icon={<Shield className="w-5 h-5 text-[var(--success)]" />} 
          />
          <StatCard 
            label={t('dashboard.avgScore')}
            value={avgScore > 0 ? avgScore : '-'} 
            icon={<Activity className="w-5 h-5 text-[var(--accent)]" />} 
          />
          <StatCard 
            label={t('dashboard.mlEngine')}
            value={t('dashboard.active')}
            icon={<span className="w-2 h-2 rounded-full bg-[var(--success)] animate-pulse" />} 
          />
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--text)] tracking-tight">
            {t('dashboard.yourTargets')}
            <span className="ml-3 text-xs font-medium px-2.5 py-0.5 rounded-full bg-[var(--surface-2)] text-[var(--text-muted)] border border-[var(--border)]">
              {websites.length === 1 ? t('dashboard.assetFound', { count: 1 }) : t('dashboard.assetsFound', { count: websites.length })}
            </span>
          </h2>
          <Link to="/websites/new" className="no-underline">
            <Button variant="primary" icon={Plus}>
              {t('dashboard.addNewTarget')}
            </Button>
          </Link>
        </div>

        {websites.length === 0 ? (
          <div className="glass-card p-12 text-center border-dashed">
            <div className="w-16 h-16 rounded-full bg-[var(--surface-2)] flex items-center justify-center mx-auto mb-4 border border-[var(--border)]">
              <Shield className="w-8 h-8 text-[var(--text-muted)]" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text)] mb-2 tracking-tight">{t('dashboard.noWebsitesTitle')}</h3>
            <p className="text-[var(--text-secondary)] mb-6 max-w-sm mx-auto text-sm">
              {t('dashboard.noWebsitesDesc')}
            </p>
            <Link to="/websites/new" className="no-underline">
              <Button variant="secondary" icon={Plus}>
                {t('dashboard.addFirstWebsite')}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {websites.map((website) => (
              <Link 
                key={website.id} 
                to={`/websites/${website.id}`}
                className="group relative glass-card p-6 flex flex-col hover:border-[var(--accent)] transition-all duration-300 no-underline outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="min-w-0 pr-4">
                    <h3 className="font-bold text-[var(--text)] text-lg truncate tracking-tight mb-1 group-hover:text-[var(--accent)] transition-colors">
                      {website.name}
                    </h3>
                    <p className="text-xs text-[var(--text-muted)] font-mono truncate">
                      {website.normalized_origin}
                    </p>
                  </div>
                  <SecurityScore score={website.last_score} />
                </div>
                
                <div className="mt-auto pt-4 border-t border-[var(--border)] flex items-center justify-between">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider border ${
                    website.verification_status === 'VERIFIED' 
                      ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/20'
                      : 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/20'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${website.verification_status === 'VERIFIED' ? 'bg-[var(--success)]' : 'bg-[var(--warning)]'}`} />
                    {website.verification_status === 'VERIFIED' ? t('dashboard.verified') : website.verification_status}
                  </span>
                  
                  <span className="text-xs font-medium text-[var(--text-muted)] group-hover:text-[var(--text)] transition-colors">
                    {t('common.view')} →
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
