import { useEffect, useState } from 'react'
import { Shield, PlusCircle, ArrowRight, Cpu, Globe } from 'lucide-react'

import { listWebsites, Website } from '../../lib/api'
import { useAuth } from '../auth/authState'

export function DashboardPage() {
  const { signOut } = useAuth()
  const [websites, setWebsites] = useState<Website[]>([])
  const [message, setMessage] = useState('Loading websites...')

  useEffect(() => {
    void listWebsites()
      .then((items) => {
        setWebsites(items)
        setMessage(items.length ? '' : 'No websites yet. Add a website to begin verification.')
      })
      .catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Unable to load websites.'))
  }, [])

  const verifiedCount = websites.filter((w) => w.verification_status === 'VERIFIED').length
  const scoredSites = websites.filter((w) => w.last_score !== null)
  const avgScore = scoredSites.length
    ? Math.round(scoredSites.reduce((acc, curr) => acc + (curr.last_score || 0), 0) / scoredSites.length)
    : null

  const getScoreColor = (score: number | null) => {
    if (score === null) return 'text-slate-500'
    if (score >= 90) return 'text-emerald-400'
    if (score >= 80) return 'text-cyan-400'
    if (score >= 70) return 'text-yellow-400'
    return 'text-rose-400'
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
            <span>ML Intelligence</span>
          </a>
          <button
            type="button"
            onClick={() => void signOut()}
            className="px-3.5 py-2 rounded-lg bg-transparent hover:bg-zinc-900 text-zinc-400 hover:text-white text-sm font-medium border border-zinc-800 transition-colors cursor-pointer"
          >
            Sign out
          </button>
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

      {/* Websites Grid */}
      <section aria-labelledby="websites-title">
        <div className="section-header flex items-center justify-between mb-4">
          <div>
            <h2 id="websites-title" className="text-xl font-semibold text-white">
              Websites
            </h2>
            <p className="subtitle text-sm text-zinc-400 mt-1">
              Verified assets and security posture.
            </p>
          </div>
          <a
            href="/websites/new"
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white hover:bg-gray-100 text-black font-medium text-sm transition-colors no-underline"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add website</span>
          </a>
        </div>

        {message ? (
          <div className="glass-card p-8 text-center text-slate-400 text-sm" role="status">
            <p>{message}</p>
          </div>
        ) : null}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 website-grid">
          {websites.map((website) => {
            const isVerified = website.verification_status === 'VERIFIED'
            return (
              <a
                href={`/websites/${website.id}`}
                className="glass-card p-6 flex flex-col justify-between group hover:border-zinc-500 transition-colors no-underline text-inherit website-card block"
                key={website.id}
                style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <p
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-md uppercase tracking-wider ${
                        isVerified
                          ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                          : 'bg-zinc-900 text-zinc-500 border border-zinc-800'
                      }`}
                    >
                      {website.verification_status}
                    </p>
                    {website.last_score !== null && (
                      <span className={`text-xs font-semibold ${getScoreColor(website.last_score)}`}>
                        Grade {website.last_score >= 90 ? 'A' : website.last_score >= 80 ? 'B' : website.last_score >= 70 ? 'C' : 'D'}
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg font-medium text-white group-hover:text-zinc-300 transition-colors">
                    {website.name}
                  </h3>
                  <p className="text-sm text-zinc-500 truncate mt-1">
                    {website.normalized_origin}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-medium text-zinc-500 block mb-1">
                      Security Posture
                    </span>
                    <strong className={`text-sm font-semibold ${website.last_score === null ? 'text-zinc-600' : getScoreColor(website.last_score)}`}>
                      {website.last_score === null ? 'Not scanned' : `${website.last_score} / 100`}
                    </strong>
                  </div>

                  <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-400 group-hover:text-white transition-colors">
                    <span>View details</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              </a>
            )
          })}
        </div>
      </section>
    </main>
  )
}
