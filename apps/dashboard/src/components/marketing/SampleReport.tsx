import { useState } from 'react';
import { ShieldAlert, Terminal, CheckCircle2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
;
import { SecurityScore } from '../ui/SecurityScore';
import { SeverityBadge } from '../ui/SeverityBadge';

export function SampleReport() {
  const { t } = useTranslation()
  const [selectedDemo, setSelectedDemo] = useState(false);

  return (
    <div className="w-full max-w-5xl mx-auto glass-card overflow-hidden shadow-2xl relative">
      <div className="absolute top-0 right-0 p-2 pointer-events-none z-10">
        <span className="text-[10px] uppercase font-bold text-[var(--accent)] tracking-widest bg-[var(--accent-dim)] px-2 py-1 rounded">
          Example / Demo Data
        </span>
      </div>

      {/* Browser Chrome */}
      <div className="bg-[var(--surface-2)] border-b border-[var(--border)] px-4 py-3 flex items-center gap-4">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-rose-500/20 border border-rose-500/50" />
          <div className="w-3 h-3 rounded-full bg-amber-500/20 border border-amber-500/50" />
          <div className="w-3 h-3 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
        </div>
        <div className="flex-1 max-w-md mx-auto bg-[var(--surface)] border border-[var(--border)] rounded-md px-3 py-1.5 text-xs text-center text-[var(--text-muted)] font-mono">
          demo.threatsentry.local
        </div>
      </div>

      <div className="p-6 md:p-8 bg-[var(--bg)] flex flex-col md:flex-row gap-8 items-start">
        <div className="w-full md:w-64 shrink-0 flex flex-col gap-6">
          <div className="p-5 glass-card bg-[var(--surface)] text-center">
            <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-2">{t('websiteDetail.score')}</div>
            <SecurityScore score={74} size="lg" className="justify-center" />
          </div>

          <div className="glass-card p-5 bg-[var(--surface)]">
            <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-4">Severity Summary</div>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-rose-400">CRITICAL</span>
                <span className="font-mono text-[var(--text)]">1</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-amber-400">HIGH</span>
                <span className="font-mono text-[var(--text)]">2</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-amber-300">MEDIUM</span>
                <span className="font-mono text-[var(--text)]">3</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-blue-400">LOW</span>
                <span className="font-mono text-[var(--text)]">2</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 w-full overflow-hidden">
          <div className="glass-card bg-[var(--surface)] overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="border-b border-[var(--border)] text-xs uppercase tracking-wider text-[var(--text-muted)]">
                <tr>
                  <th className="p-4 font-semibold">Severity</th>
                  <th className="p-4 font-semibold">{t('websiteDetail.colFinding')}</th>
                  <th className="p-4 font-semibold">{t('websiteDetail.colEndpoint')}</th>
                  <th className="p-4 font-semibold">{t('websiteDetail.colCategory')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-[var(--text-secondary)]">
                <tr className="hover:bg-[var(--surface-2)] cursor-pointer transition-colors" onClick={() => setSelectedDemo(true)}>
                  <td className="p-4"><SeverityBadge severity="HIGH" /></td>
                  <td className="p-4 font-medium text-[var(--text)]">Missing Content-Security-Policy</td>
                  <td className="p-4 font-mono text-xs">/</td>
                  <td className="p-4 text-xs font-mono">Security Headers</td>
                </tr>
                <tr className="hover:bg-[var(--surface-2)] cursor-pointer transition-colors" onClick={() => setSelectedDemo(true)}>
                  <td className="p-4"><SeverityBadge severity="CRITICAL" /></td>
                  <td className="p-4 font-medium text-[var(--text)]">Potential SQL Injection</td>
                  <td className="p-4 font-mono text-xs">/api/products</td>
                  <td className="p-4 text-xs font-mono">SQL Injection</td>
                </tr>
                <tr className="hover:bg-[var(--surface-2)] cursor-pointer transition-colors" onClick={() => setSelectedDemo(true)}>
                  <td className="p-4"><SeverityBadge severity="HIGH" /></td>
                  <td className="p-4 font-medium text-[var(--text)]">Reflected input detected</td>
                  <td className="p-4 font-mono text-xs">/search?q=</td>
                  <td className="p-4 text-xs font-mono">XSS</td>
                </tr>
                <tr className="hover:bg-[var(--surface-2)] cursor-pointer transition-colors" onClick={() => setSelectedDemo(true)}>
                  <td className="p-4"><SeverityBadge severity="LOW" /></td>
                  <td className="p-4 font-medium text-[var(--text)]">Exposed server signature</td>
                  <td className="p-4 font-mono text-xs">/</td>
                  <td className="p-4 text-xs font-mono">Information Disclosure</td>
                </tr>
              </tbody>
            </table>
          </div>

          {selectedDemo && (
            <div className="mt-6 p-6 glass-card bg-[#0c1524] border border-[#1e293b] animate-in fade-in slide-in-from-bottom-4 duration-300">
              <div className="flex items-center gap-3 mb-4">
                <SeverityBadge severity="CRITICAL" />
                <span className="px-2 py-0.5 text-[11px] font-bold rounded uppercase tracking-wider bg-[#0f172a] text-cyan-400 border border-[#1e293b]">
                  SQL_INJECTION
                </span>
              </div>
              
              <h4 className="text-xl font-bold text-white mb-4">Potential SQL Injection</h4>
              
              <div className="flex items-center gap-2 p-3 bg-black/50 border border-[#1e293b] rounded-lg mb-6 font-mono text-xs text-cyan-300">
                <span className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 font-bold">ENDPOINT</span>
                GET /api/products
                <span className="ml-auto text-amber-300 font-sans px-2 py-0.5 rounded bg-amber-950/40 border border-amber-800/40">
                  Param: <code>search</code>
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5" /> What we found
                  </h5>
                  <p className="text-sm text-slate-300 bg-slate-900/50 p-3 rounded-lg border border-slate-800">
                    The endpoint response changes significantly when SQL boolean differential payloads are injected, indicating potential database execution.
                  </p>
                </div>
                <div>
                  <h5 className="text-[10px] uppercase font-bold text-slate-400 tracking-widest mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> How to fix
                  </h5>
                  <p className="text-sm text-emerald-200 bg-emerald-950/20 p-3 rounded-lg border border-emerald-900/40">
                    Use parameterized queries or prepared statements. Do not concatenate user input directly into SQL strings.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

