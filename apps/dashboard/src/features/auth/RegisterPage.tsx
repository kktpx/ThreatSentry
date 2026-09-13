import { FormEvent, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { Shield } from 'lucide-react'
import { supabase } from '../../lib/supabase'

export function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  const redirect = searchParams.get('redirect') || '/dashboard'

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const { error: authError } = await supabase.auth.signUp({ email, password })
      if (authError) throw authError
      navigate(redirect, { replace: true })
    } catch (err: any) {
      setError(err.message || 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex bg-[var(--bg)]">
      {/* Left side product statement - hidden on mobile */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 border-r border-[var(--border)] bg-[var(--surface-2)]">
        <Link to="/" className="flex items-center gap-2.5 text-inherit no-underline font-sans font-bold text-xl tracking-tight text-[var(--text)]">
          <Shield className="w-6 h-6 text-[var(--accent)]" />
          <span>ThreatSentry</span>
        </Link>
        
        <div className="max-w-md">
          <h2 className="text-3xl font-extrabold text-[var(--text)] tracking-tight mb-4 leading-tight">
            Secure your web applications before deployment.
          </h2>
          <p className="text-[var(--text-secondary)]">
            Create an account to start scanning authorized targets for vulnerabilities using deterministic engines and ML.
          </p>
        </div>

        <div className="text-sm font-mono text-[var(--text-muted)]">
          &copy; {new Date().getFullYear()} ThreatSentry Project
        </div>
      </div>

      {/* Right side auth form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-24">
        <div className="w-full max-w-sm mx-auto">
          <div className="mb-10 lg:hidden flex justify-center">
            <Link to="/" className="flex items-center gap-2.5 text-inherit no-underline font-sans font-bold text-2xl tracking-tight text-[var(--text)]">
              <Shield className="w-8 h-8 text-[var(--accent)]" />
              <span>ThreatSentry</span>
            </Link>
          </div>

          <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight mb-2">Create an account</h1>
          <p className="text-sm text-[var(--text-secondary)] mb-8">
            Enter your details to get started
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)] mb-1.5" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg p-3 text-sm text-[var(--text)] outline-none transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-[var(--text-secondary)] mb-1.5" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                className="w-full bg-[var(--surface-2)] border border-[var(--border)] focus:border-[var(--accent)] rounded-lg p-3 text-sm text-[var(--text)] outline-none transition-colors"
              />
            </div>
            
            {error && (
              <div role="alert" className="p-3 text-sm rounded bg-[var(--danger)]/10 text-[var(--danger)] border border-[var(--danger)]/20">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-[var(--text)] text-[var(--bg)] hover:bg-[var(--text-secondary)] rounded-lg font-semibold text-sm transition-colors cursor-pointer"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <p className="mt-8 text-center text-sm text-[var(--text-secondary)]">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[var(--text)] hover:text-[var(--accent)] transition-colors no-underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
