import { Shield, Globe, Cpu, LogOut, PlusCircle } from 'lucide-react'
import { useAuth } from '../features/auth/authState'

export function Navbar() {
  let currentPath = ''
  if (typeof window !== 'undefined') {
    currentPath = window.location.pathname
  }

  let signOut = async () => {}
  let userEmail: string | null = null
  try {
    const auth = useAuth()
    signOut = auth.signOut
    userEmail = auth.session?.user?.email || null
  } catch {
    // Gracefully handle rendering in tests without AuthProvider
  }

  const isActive = (path: string) => currentPath === path

  return (
    <header className="border-b border-[#1c2b42] bg-[#070d18]/80 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <a href="/dashboard" className="flex items-center gap-2.5 text-inherit no-underline">
            <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold tracking-tight text-white text-base">ThreatSentry</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                Security Scanner
              </span>
            </div>
          </a>

          <nav className="hidden md:flex items-center gap-1">
            <a
              href="/dashboard"
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors no-underline ${
                isActive('/dashboard')
                  ? 'bg-[#111e33] text-cyan-400 border border-[#2a3f5f]'
                  : 'text-slate-400 hover:text-white hover:bg-[#0c1524]'
              }`}
            >
              Dashboard
            </a>
            <a
              href="/websites/new"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors no-underline ${
                isActive('/websites/new')
                  ? 'bg-[#111e33] text-cyan-400 border border-[#2a3f5f]'
                  : 'text-slate-400 hover:text-white hover:bg-[#0c1524]'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Website</span>
            </a>
            <a
              href="/model"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors no-underline ${
                isActive('/model')
                  ? 'bg-[#111e33] text-cyan-400 border border-[#2a3f5f]'
                  : 'text-slate-400 hover:text-white hover:bg-[#0c1524]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>ML Intelligence</span>
            </a>
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {userEmail && (
            <span className="hidden lg:inline-block text-xs font-mono text-slate-400 bg-[#0c1524] px-2.5 py-1 rounded border border-[#1c2b42]">
              {userEmail}
            </span>
          )}
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-slate-400 hover:text-rose-400 hover:bg-rose-950/20 border border-transparent hover:border-rose-900/40 transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </header>
  )
}
