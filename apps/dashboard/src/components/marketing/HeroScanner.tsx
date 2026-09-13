import { useTranslation } from 'react-i18next'
import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../features/auth/authState';
import { Button } from '../ui/Button';

export function HeroScanner() {
  const { t } = useTranslation()
  const [url, setUrl] = useState('https://');
  const navigate = useNavigate();
  
  let isAuthenticated = false;
  try {
    const { session } = useAuth();
    isAuthenticated = !!session;
  } catch {
    // Graceful fallback
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetUrl = url.trim();
    if (!targetUrl || targetUrl === 'https://') return;

    if (isAuthenticated) {
      navigate(`/websites/new?url=${encodeURIComponent(targetUrl)}`);
    } else {
      sessionStorage.setItem('threatsentry_pending_target', targetUrl);
      navigate('/register?redirect=/websites/new');
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto xl:mx-0 glass-card bg-[var(--surface)] overflow-hidden shadow-2xl relative">
      <div className="absolute top-0 right-0 p-2 pointer-events-none">
        <span className="text-[10px] uppercase font-bold text-[var(--accent)] tracking-widest bg-[var(--accent-dim)] px-2 py-1 rounded">
          Demo Preview
        </span>
      </div>

      <div className="p-6 md:p-8 border-b border-[var(--border)]">
        <h3 className="font-semibold text-lg text-[var(--text)] mb-1">ThreatSentry — Security Scanner</h3>
        <p className="text-sm text-[var(--text-secondary)] mb-5">Enter a website you are authorized to assess</p>
        
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm font-mono text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition-colors"
            placeholder="https://example.com"
            required
          />
          <Button type="submit" variant="primary" size="lg" className="shrink-0 w-full sm:w-auto">
            Analyze Target &rarr;
          </Button>
        </form>
      </div>

      <div className="p-6 md:p-8 bg-[var(--surface-2)]">
        <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
          <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
            <span className="text-[var(--text-secondary)]">Ownership Verification</span>
            <span className="text-xs font-mono font-bold text-[var(--warning)]">REQUIRED</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
            <span className="text-[var(--text-secondary)]">Passive Security Checks</span>
            <span className="text-xs font-mono font-bold text-[var(--success)]">READY</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
            <span className="text-[var(--text-secondary)]">Active Scan</span>
            <span className="text-xs font-mono font-bold text-[var(--text-muted)]">VERIFIED TARGETS</span>
          </div>
          <div className="flex justify-between items-center py-2 border-b border-[var(--border)]">
            <span className="text-[var(--text-secondary)]">ML Threat Analysis</span>
            <span className="text-xs font-mono font-bold text-[var(--accent)]">ACTIVE</span>
          </div>
        </div>

        <div className="flex items-center gap-6 p-5 rounded-xl border border-[var(--border)] bg-[var(--bg)]">
          <div className="text-center pr-6 border-r border-[var(--border)]">
            <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-1">Security {t('websiteDetail.score')}</div>
            <div className="text-3xl font-mono font-bold text-[var(--success)] leading-none">
              78<span className="text-sm font-sans text-[var(--text-muted)]">/100</span>
            </div>
          </div>
          
          <div className="flex-1 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text)]">Security Headers</span>
              <span className="text-[var(--warning)] font-mono">2 findings</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text)]">SQL Injection</span>
              <span className="text-[var(--success)] font-mono">Protected</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text)]">Reflected XSS</span>
              <span className="text-[var(--danger)] font-mono">1 finding</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[var(--text)]">Sensitive Exposure</span>
              <span className="text-[var(--warning)] font-mono">1 finding</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
