import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../features/auth/authState';
import { Button } from '../ui/Button';
import { SectionHeader } from '../ui/SectionHeader';
import { ShieldCheck, Database, Brain } from 'lucide-react'
import { useTranslation } from 'react-i18next'
;

export function FinalCTA() {
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
    <section className="py-24 px-6 md:px-12 bg-gradient-to-b from-[var(--bg)] to-[var(--surface)] text-center">
      <SectionHeader 
        title="Know your attack surface before someone else does."
        description="{t('marketing.ctaDesc')}"
        centered
      />
      
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 justify-center max-w-lg mx-auto mb-10">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 bg-[var(--surface-2)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm font-mono text-[var(--text)] focus:border-[var(--accent)] focus:outline-none transition-colors"
          placeholder="https://example.com"
          required
        />
        <Button type="submit" variant="primary" size="lg" className="shrink-0">
          Add Target &rarr;
        </Button>
      </form>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 text-[11px] uppercase font-bold tracking-wider text-[var(--text-muted)]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-[var(--success)]" />
          <span>Authorized Targets Only</span>
        </div>
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-[var(--accent)]" />
          <span>Passive + Active Scanning</span>
        </div>
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-[var(--warning)]" />
          <span>ML-Assisted Analysis</span>
        </div>
      </div>
    </section>
  );
}

