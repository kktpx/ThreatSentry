import { FormEvent, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Shield, ChevronRight, Copy, CheckCircle2 } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { createWebsite, verifyWebsite } from '../../lib/api'
import { Navbar } from '../../components/Navbar'
import { Button } from '../../components/ui/Button'
import { useTranslation } from 'react-i18next'

export function AddWebsitePage() {
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [verificationToken, setVerificationToken] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [websiteId, setWebsiteId] = useState<string | null>(null)
  const [copiedFile, setCopiedFile] = useState(false)
  const [copiedContent, setCopiedContent] = useState(false)
  const navigate = useNavigate()
  const { t } = useTranslation()

  const copyToClipboard = async (text: string, isFile: boolean) => {
    try {
      await navigator.clipboard.writeText(text)
      if (isFile) {
        setCopiedFile(true)
        setTimeout(() => setCopiedFile(false), 2000)
      } else {
        setCopiedContent(true)
        setTimeout(() => setCopiedContent(false), 2000)
      }
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  async function handleAdd(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('No session')

      let cleanUrl = url.trim()
      if (!cleanUrl.startsWith('http')) {
        cleanUrl = 'https://' + cleanUrl
      }
      
      const newSite = await createWebsite({
        name: name.trim(),
        url: cleanUrl
      })
      
      setWebsiteId(newSite.id)
      setVerificationToken(newSite.verification_token || null)
      setStep(2)
      
    } catch (err: any) {
      setError(err.message || t('addWebsite.errorAddWebsite'))
    } finally {
      setLoading(false)
    }
  }

  async function handleVerify() {
    if (!websiteId) return
    setVerifying(true)
    setError(null)
    try {
      await verifyWebsite(websiteId)
      setStep(3)
    } catch (err: any) {
      if (err.message?.includes('404') || err.message?.includes('match')) {
        setError(t('addWebsite.errorVerifyFailed'))
      } else {
        setError(err.message || t('addWebsite.errorVerifyUnable'))
      }
    } finally {
      setVerifying(false)
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      <main className="app-container pt-8 pb-20">
        <div className="max-w-2xl mx-auto">
          
          {/* Breadcrumb */}
          <div className="mb-6">
            <Link to="/dashboard" className="text-sm font-semibold text-[var(--text-muted)] hover:text-[var(--text)] transition-colors no-underline">
              ← {t('common.backToDashboard')}
            </Link>
          </div>

          <div className="mb-8">
            <h4 className="eyebrow mb-2">{t('addWebsite.eyebrow')}</h4>
            <h1 className="text-3xl font-extrabold text-[var(--text)] tracking-tight mb-2">
              {t('addWebsite.title')}
            </h1>
            <p className="text-[var(--text-secondary)]">
              {t('addWebsite.description')}
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-2 mb-10 text-sm font-semibold">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${step >= 1 ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[var(--surface-2)] text-[var(--text-muted)]'}`}>
              <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-xs">1</span>
              {t('addWebsite.stepTarget')}
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--border)]" />
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors duration-300 ${step >= 2 ? 'bg-[var(--accent)] text-[var(--bg)]' : 'bg-[var(--surface-2)] text-[var(--text-muted)]'}`}>
              <span className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center text-xs">2</span>
              {t('addWebsite.stepVerify')}
            </div>
            <ChevronRight className="w-4 h-4 text-[var(--border)]" />
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors duration-300 ${step === 3 ? 'bg-[var(--success)] text-[var(--bg)]' : 'bg-[var(--surface-2)] text-[var(--text-muted)]'}`}>
              <span className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center text-xs">3</span>
              {t('addWebsite.stepScan')}
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-[var(--danger)]/10 border border-[var(--danger)]/20 flex items-start gap-3 animate-in slide-in-from-top-2">
              <Shield className="w-5 h-5 text-[var(--danger)] shrink-0 mt-0.5" />
              <div className="text-sm text-[var(--danger)]">
                {error}
              </div>
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleAdd} className="glass-card p-6 md:p-8 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2" htmlFor="name">
                  {t('addWebsite.websiteName')}
                </label>
                <input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder={t('addWebsite.websiteNamePlaceholder')}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg p-3.5 text-sm text-[var(--text)] outline-none transition-colors"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-2" htmlFor="url">
                  {t('addWebsite.websiteUrl')}
                </label>
                <input
                  id="url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  placeholder={t('addWebsite.websiteUrlPlaceholder')}
                  className="w-full bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg p-3.5 text-sm text-[var(--text)] font-mono outline-none transition-colors"
                />
              </div>

              <div className="pt-4 border-t border-[var(--border)]">
                <Button
                  type="submit"
                  disabled={loading || !name || !url}
                  variant="primary"
                  className="w-full justify-center py-3.5"
                >
                  {loading ? t('addWebsite.addingTarget') : t('addWebsite.continueToVerification')}
                </Button>
              </div>
            </form>
          )}

          {step === 2 && verificationToken && (
            <div className="glass-card p-6 md:p-8 animate-in fade-in slide-in-from-right-8 duration-500">
              <h2 className="text-xl font-bold text-[var(--text)] mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5 text-[var(--accent)]" />
                {t('addWebsite.verifyOwnership')}
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-8 max-w-xl leading-relaxed">
                {t('addWebsite.verifyDesc')}
              </p>

              <div className="space-y-8">
                {/* Step 1 */}
                <div>
                  <h3 className="text-sm font-bold text-[var(--text)] mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-xs text-[var(--text-muted)]">1</span>
                    {t('addWebsite.createFile')}
                  </h3>
                  <div className="flex items-stretch gap-2 ml-8">
                    <code className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] p-3 rounded-lg text-sm font-mono text-[var(--accent)] overflow-x-auto">
                      /.well-known/threatsentry.txt
                    </code>
                    <button 
                      onClick={() => copyToClipboard('/.well-known/threatsentry.txt', true)}
                      className="px-4 bg-[var(--surface-2)] hover:bg-[var(--border)] border border-[var(--border)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                      title={t('addWebsite.copyFilename')}
                    >
                      {copiedFile ? <CheckCircle2 className="w-4 h-4 text-[var(--success)]" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="ml-8 mt-2 text-xs text-[var(--text-muted)] leading-relaxed">
                    <strong>Tip:</strong> {t('addWebsite.folderTip')}
                  </p>
                </div>

                {/* Step 2 */}
                <div>
                  <h3 className="text-sm font-bold text-[var(--text)] mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-xs text-[var(--text-muted)]">2</span>
                    {t('addWebsite.withContent')}
                  </h3>
                  <div className="flex items-stretch gap-2 ml-8">
                    <code className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] p-3 rounded-lg text-sm font-mono text-[var(--text)] break-all">
                      {verificationToken}
                    </code>
                    <button 
                      onClick={() => copyToClipboard(verificationToken, false)}
                      className="px-4 bg-[var(--surface-2)] hover:bg-[var(--border)] border border-[var(--border)] rounded-lg text-[var(--text-muted)] hover:text-[var(--text)] transition-colors cursor-pointer"
                      title={t('addWebsite.copyContent')}
                    >
                      {copiedContent ? <CheckCircle2 className="w-4 h-4 text-[var(--success)]" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Step 3 (Deploy) */}
                <div>
                  <h3 className="text-sm font-bold text-[var(--text)] mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-center text-xs text-[var(--text-muted)]">3</span>
                    {t('addWebsite.deployStep')}
                  </h3>
                  <div className="ml-8 p-4 bg-[var(--surface-2)]/50 border border-[var(--border)] rounded-lg text-sm text-[var(--text-secondary)] leading-relaxed">
                    <p className="mb-2">
                      {t('addWebsite.deployDesc')}
                    </p>
                    <code className="block bg-[var(--bg)] p-2 rounded border border-[var(--border)] text-[var(--accent)] mb-3 font-mono text-xs">
                      git add public/.well-known/threatsentry.txt<br/>
                      git commit -m "Add verification file"<br/>
                      git push
                    </code>
                    <p className="text-[var(--warning)] font-medium text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-[var(--warning)] animate-pulse" />
                      {t('addWebsite.deployWait')}
                    </p>
                  </div>
                </div>

                <div className="pt-6 border-t border-[var(--border)] flex gap-4 ml-8">
                  <Button
                    onClick={handleVerify}
                    disabled={verifying}
                    variant="primary"
                    className="flex-1 justify-center py-3.5"
                  >
                    {verifying ? t('addWebsite.verifying') : t('addWebsite.verifyOwnership')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && websiteId && (
            <div className="glass-card p-10 text-center animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-[var(--success)]/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-[var(--success)]/20 shadow-[0_0_30px_rgba(var(--success-rgb),0.2)]">
                <CheckCircle2 className="w-10 h-10 text-[var(--success)]" />
              </div>
              <h2 className="text-3xl font-extrabold text-[var(--text)] tracking-tight mb-3">
                {t('addWebsite.targetVerified')}
              </h2>
              <p className="text-[var(--text-secondary)] mb-8 max-w-sm mx-auto leading-relaxed">
                {t('addWebsite.targetVerifiedDesc', { name })}
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => navigate(`/websites/${websiteId}`)}
                  variant="primary"
                  className="justify-center"
                >
                  {t('addWebsite.openTargetDashboard')}
                </Button>
                <Button 
                  onClick={() => navigate('/dashboard')}
                  variant="secondary"
                  className="justify-center"
                >
                  {t('addWebsite.backToOverview')}
                </Button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
