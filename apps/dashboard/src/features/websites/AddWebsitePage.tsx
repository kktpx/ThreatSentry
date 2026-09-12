import { FormEvent, useState } from 'react'
import { Link } from 'react-router'
import { Shield, Globe, ArrowLeft, CheckCircle2, AlertTriangle, Key } from 'lucide-react'

import { createWebsite, verifyWebsite } from '../../lib/api'

export function AddWebsitePage() {
  const [token, setToken] = useState<string | null>(null)
  const [websiteId, setWebsiteId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsAdding(true)
    const form = new FormData(event.currentTarget)
    try {
      const website = await createWebsite({
        name: String(form.get('name') ?? ''),
        url: String(form.get('url') ?? ''),
      })
      setToken(website.verification_token)
      setWebsiteId(website.id)
      setMessage(null)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to add website.')
    } finally {
      setIsAdding(false)
    }
  }

  async function verify() {
    if (!websiteId) return
    setIsVerifying(true)
    try {
      const website = await verifyWebsite(websiteId)
      setMessage(
        website.verification_status === 'VERIFIED'
          ? 'Ownership verified. You can now start a scan.'
          : 'Verification failed. Check the file path and content, then try again.'
      )
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to verify ownership.')
    } finally {
      setIsVerifying(false)
    }
  }

  return (
    <main className="app-shell">
      <div className="w-full max-w-2xl">
        <header className="mb-6">
          <p className="eyebrow">ASSET ONBOARDING</p>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mt-1">Add website</h1>
          <p className="subtitle text-sm text-slate-400 mt-1">
            Only add websites you own or are explicitly authorized to assess.
          </p>
        </header>

        <div className="space-y-6">
          <form className="glass-card p-6 sm:p-8 space-y-4" onSubmit={submit}>
            <div>
              <label htmlFor="name" className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                Website name
              </label>
              <input
                id="name"
                name="name"
                required
                maxLength={120}
                placeholder="My Production Store"
                className="w-full bg-[#040810] border border-[#1c2b42] focus:border-cyan-500 rounded-lg p-3 text-sm text-white outline-none transition-colors"
              />
            </div>

            <div>
              <label htmlFor="url" className="block text-xs font-semibold uppercase text-slate-300 mb-1.5">
                Website URL
              </label>
              <input
                id="url"
                name="url"
                type="url"
                placeholder="https://example.com"
                required
                className="w-full bg-[#040810] border border-[#1c2b42] focus:border-cyan-500 rounded-lg p-3 text-sm text-white font-mono outline-none transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={isAdding}
              className="w-full py-3 px-4 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all cursor-pointer mt-2"
            >
              {isAdding ? 'Adding website...' : 'Add website'}
            </button>
          </form>

          {token && (
            <section className="glass-card p-6 sm:p-8 space-y-4 border-amber-500/40 bg-amber-950/10">
              <div className="flex items-center gap-2 text-amber-400">
                <Key className="w-5 h-5" />
                <h2 className="text-lg font-bold text-white">Verify ownership</h2>
              </div>
              <p className="text-xs text-slate-300">
                To prevent unauthorized scanning, prove ownership by publishing the verification file:
              </p>

              <div className="space-y-3">
                <div>
                  <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
                    1. Create this file on your website:
                  </span>
                  <div className="p-2.5 bg-[#040810] border border-[#1c2b42] rounded-lg font-mono text-xs text-cyan-300 break-all">
                    <code>/.well-known/threatsentry.txt</code>
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-semibold uppercase text-slate-400 block mb-1">
                    2. With exactly this content:
                  </span>
                  <div className="p-2.5 bg-[#040810] border border-[#1c2b42] rounded-lg font-mono text-xs text-amber-300 break-all">
                    <code>{`threatsentry-verification=${token}`}</code>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void verify()}
                disabled={isVerifying}
                className="w-full py-3 px-4 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
              >
                {isVerifying ? 'Verifying...' : 'Verify ownership'}
              </button>
            </section>
          )}

          {message && (
            <div
              role="alert"
              className={`p-4 rounded-lg text-sm font-medium border ${
                message.includes('verified')
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800 text-rose-300'
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </main>
  )
}
