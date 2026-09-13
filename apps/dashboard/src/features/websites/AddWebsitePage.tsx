import { FormEvent, useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router'
import { CheckCircle2, AlertTriangle, Key, ArrowRight, Copy, ArrowLeft } from 'lucide-react'
import { createWebsite, verifyWebsite } from '../../lib/api'
import { Button } from '../../components/ui/Button'
import { SectionHeader } from '../../components/ui/SectionHeader'
import { Navbar } from '../../components/Navbar'

export function AddWebsitePage() {
  const [searchParams] = useSearchParams()
  const urlParam = searchParams.get('url')
  
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [token, setToken] = useState<string | null>(null)
  const [websiteId, setWebsiteId] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isVerified, setIsVerified] = useState(false)

  // Step logic
  let step = 1;
  if (isVerified) step = 3;
  else if (token) step = 2;

  useEffect(() => {
    // 1. Try URL param
    if (urlParam) {
      setUrl(urlParam)
      try {
        const urlObj = new URL(urlParam)
        setName(urlObj.hostname)
      } catch {
        // Ignore invalid URL parsing for name guess
      }
    } else {
      // 2. Try session storage
      const pendingUrl = sessionStorage.getItem('threatsentry_pending_target')
      if (pendingUrl) {
        setUrl(pendingUrl)
        try {
          const urlObj = new URL(pendingUrl)
          setName(urlObj.hostname)
        } catch {
          // Ignore
        }
        sessionStorage.removeItem('threatsentry_pending_target')
      }
    }
  }, [urlParam])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsAdding(true)
    try {
      const website = await createWebsite({ name, url })
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
      if (website.verification_status === 'VERIFIED') {
        setIsVerified(true)
        setMessage(null)
      } else {
        setMessage('Verification failed. Check the file path and content, then try again.')
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to verify ownership.')
    } finally {
      setIsVerifying(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navbar />
      <main className="app-container">
        <div className="w-full max-w-3xl mx-auto pt-8">
          <Link to="/dashboard" className="text-[var(--accent)] hover:underline mb-6 inline-flex items-center gap-1.5 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>
          <SectionHeader 
            eyebrow="ASSET ONBOARDING"
            title="Add new target"
            description="Only add websites you own or are explicitly authorized to assess."
          />

        {/* Step Indicator */}
        <div className="flex items-center gap-2 sm:gap-4 mb-10 font-mono text-sm overflow-x-auto pb-2">
          <div className={`flex items-center gap-2 whitespace-nowrap ${step >= 1 ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 1 ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[var(--surface-2)] border border-[var(--border)]'}`}>1</span>
            Target
          </div>
          <div className="h-px bg-[var(--border)] flex-1 min-w-[20px]"></div>
          <div className={`flex items-center gap-2 whitespace-nowrap ${step >= 2 ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 2 ? 'bg-[var(--warning)] text-[var(--bg)]' : step > 2 ? 'bg-[var(--success)] text-[var(--bg)]' : 'bg-[var(--surface-2)] border border-[var(--border)]'}`}>
              {step > 2 ? <CheckCircle2 className="w-3.5 h-3.5" /> : '2'}
            </span>
            Verify
          </div>
          <div className="h-px bg-[var(--border)] flex-1 min-w-[20px]"></div>
          <div className={`flex items-center gap-2 whitespace-nowrap ${step >= 3 ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${step === 3 ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[var(--surface-2)] border border-[var(--border)]'}`}>3</span>
            Scan
          </div>
        </div>

        <div className="space-y-6">
          {step === 1 && (
            <form className="glass-card p-6 sm:p-8 space-y-5 animate-in fade-in" onSubmit={submit}>
              <div>
                <label htmlFor="name" className="block text-xs font-semibold uppercase text-[var(--text-secondary)] mb-1.5">
                  Website Name
                </label>
                <input
                  id="name"
                  name="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={120}
                  placeholder="My Production Store"
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg p-3 text-sm text-[var(--text)] outline-none transition-colors"
                />
              </div>

              <div>
                <label htmlFor="url" className="block text-xs font-semibold uppercase text-[var(--text-secondary)] mb-1.5">
                  Website URL
                </label>
                <input
                  id="url"
                  name="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  required
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg p-3 text-sm text-[var(--text)] font-mono outline-none transition-colors"
                />
              </div>

              <div className="pt-2">
                <Button type="submit" variant="primary" disabled={isAdding} className="w-full">
                  {isAdding ? 'Adding target...' : 'Continue to Verification'} &rarr;
                </Button>
              </div>
            </form>
          )}

          {step === 2 && token && (
            <section className="glass-card p-6 sm:p-8 space-y-6 border-[var(--warning)]/40 bg-[var(--warning)]/5 animate-in fade-in">
              <div className="flex items-center gap-2 text-[var(--warning)]">
                <Key className="w-5 h-5" />
                <h2 className="text-lg font-bold text-[var(--text)]">Verify Ownership</h2>
              </div>
              <p className="text-sm text-[var(--text-secondary)]">
                To prevent unauthorized scanning, prove ownership by publishing the verification file to your web server:
              </p>

              <div className="space-y-4">
                <div>
                  <span className="text-[11px] font-semibold uppercase text-[var(--text-secondary)] block mb-1.5">
                    1. Create this file on your website:
                  </span>
                  <div className="flex items-center bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden">
                    <code className="p-3 text-sm text-[var(--accent)] font-mono flex-1 border-r border-[var(--border)]">
                      /.well-known/threatsentry.txt
                    </code>
                    <button 
                      type="button" 
                      onClick={() => copyToClipboard('/.well-known/threatsentry.txt')}
                      className="p-3 hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                      title="Copy filename"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-2.5 leading-relaxed">
                    <strong>Tip:</strong> Create a folder named <code className="bg-[var(--surface-2)] border border-[var(--border)] px-1 py-0.5 rounded font-mono text-[11px] text-[var(--text)]">.well-known</code> in your web server's public root directory (e.g., <code className="bg-[var(--surface-2)] border border-[var(--border)] px-1 py-0.5 rounded font-mono text-[11px] text-[var(--text)]">public/</code>, <code className="bg-[var(--surface-2)] border border-[var(--border)] px-1 py-0.5 rounded font-mono text-[11px] text-[var(--text)]">htdocs/</code>, or <code className="bg-[var(--surface-2)] border border-[var(--border)] px-1 py-0.5 rounded font-mono text-[11px] text-[var(--text)]">var/www/html/</code>). Then, create the <code className="bg-[var(--surface-2)] border border-[var(--border)] px-1 py-0.5 rounded font-mono text-[11px] text-[var(--text)]">threatsentry.txt</code> file inside it.
                  </p>
                </div>

                <div>
                  <span className="text-[11px] font-semibold uppercase text-[var(--text-secondary)] block mb-1.5">
                    2. With exactly this content:
                  </span>
                  <div className="flex items-center bg-[var(--surface)] border border-[var(--border)] rounded-lg overflow-hidden">
                    <code className="p-3 text-sm text-[var(--warning)] font-mono flex-1 border-r border-[var(--border)]">
                      threatsentry-verification={token}
                    </code>
                    <button 
                      type="button" 
                      onClick={() => copyToClipboard(`threatsentry-verification=${token}`)}
                      className="p-3 hover:bg-[var(--surface-2)] text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                      title="Copy content"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <Button type="button" variant="primary" onClick={() => void verify()} disabled={isVerifying} className="w-full">
                  {isVerifying ? 'Verifying...' : 'Verify Ownership'}
                </Button>
              </div>
            </section>
          )}

          {step === 3 && websiteId && (
            <div className="glass-card p-10 text-center border-[var(--success)]/40 bg-[var(--success)]/5 animate-in zoom-in-95">
              <div className="w-16 h-16 bg-[var(--success)]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-8 h-8 text-[var(--success)]" />
              </div>
              <h2 className="text-2xl font-bold text-[var(--text)] mb-2">Target Verified</h2>
              <p className="text-[var(--text-secondary)] mb-8 max-w-md mx-auto">
                Ownership of {name} has been confirmed. You can now perform deep security assessments.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button asChild to={`/websites/${websiteId}`} variant="primary">
                  Open Target Dashboard
                </Button>
                <Button asChild to="/dashboard" variant="secondary">
                  Back to Overview
                </Button>
              </div>
            </div>
          )}

          {message && (
            <div
              role="alert"
              className={`p-4 rounded-lg text-sm font-medium border flex items-start gap-3 ${
                message.includes('verified')
                  ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                  : 'bg-rose-950/40 border-rose-800 text-rose-300'
              }`}
            >
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{message}</span>
            </div>
          )}
        </div>
      </div>
    </main>
    </div>
  )
}
