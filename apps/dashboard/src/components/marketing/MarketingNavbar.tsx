import { Shield } from 'lucide-react';
import { useAuth } from '../../features/auth/authState';
import { Button } from '../ui/Button';

export function MarketingNavbar() {
  let isAuthenticated = false;
  try {
    const { session } = useAuth();
    isAuthenticated = !!session;
  } catch {
    // Graceful fallback for tests/unwrapped contexts
  }

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    } else if (id === 'top') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 bg-[var(--bg)]/80 backdrop-blur-md border-b border-[var(--border)]">
      <div className="flex items-center gap-10">
        <button 
          onClick={() => scrollTo('top')}
          className="flex items-center gap-2.5 text-inherit no-underline font-sans font-bold text-lg tracking-tight text-[var(--text)] cursor-pointer bg-transparent border-none p-0"
        >
          <Shield className="w-5 h-5 text-[var(--accent)]" />
          <span>ThreatSentry</span>
        </button>

        <div className="hidden lg:flex items-center gap-6">
          <button onClick={() => scrollTo('top')} className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors cursor-pointer bg-transparent border-none p-0">Overview</button>
          <button onClick={() => scrollTo('coverage')} className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors cursor-pointer bg-transparent border-none p-0">Coverage</button>
          <button onClick={() => scrollTo('how-it-works')} className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors cursor-pointer bg-transparent border-none p-0">How It Works</button>
          <button onClick={() => scrollTo('ml-engine')} className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors cursor-pointer bg-transparent border-none p-0">ML Engine</button>
          <button onClick={() => scrollTo('sample-report')} className="text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors cursor-pointer bg-transparent border-none p-0">Sample Report</button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <a 
          href="https://github.com/kktpx/Threatsentry" 
          target="_blank" 
          rel="noopener noreferrer"
          className="hidden md:block text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors no-underline"
        >
          GitHub
        </a>
        
        {isAuthenticated ? (
          <Button asChild to="/dashboard" variant="primary" size="sm">
            Open Dashboard &rarr;
          </Button>
        ) : (
          <>
            <a href="/login" className="hidden sm:block text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors no-underline">
              Sign In
            </a>
            <Button asChild to="/register" variant="primary" size="sm">
              Get Started &rarr;
            </Button>
          </>
        )}
      </div>
    </nav>
  );
}
