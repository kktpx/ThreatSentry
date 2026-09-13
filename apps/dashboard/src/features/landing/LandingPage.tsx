import { MarketingNavbar } from '../../components/marketing/MarketingNavbar';
import { HeroScanner } from '../../components/marketing/HeroScanner';
import { MetricsStrip } from '../../components/marketing/MetricsStrip';
import { CoverageCard } from '../../components/marketing/CoverageCard';
import { WorkflowStep } from '../../components/marketing/WorkflowStep';
import { SampleReport } from '../../components/marketing/SampleReport';
import { FinalCTA } from '../../components/marketing/FinalCTA';
import { MarketingFooter } from '../../components/marketing/MarketingFooter';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Button } from '../../components/ui/Button';
import { 
  ShieldCheck, 
  Shield, 
  Database, 
  Code2, 
  FileWarning, 
  Brain, 
  Globe, 
  Search, 
  FileText,
  Lock
} from 'lucide-react';
import { useAuth } from '../auth/authState';

export function LandingPage() {
  let isAuthenticated = false;
  try {
    const { session } = useAuth();
    isAuthenticated = !!session;
  } catch {
    // Graceful fallback
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] selection:bg-[var(--accent)] selection:text-[var(--bg)]">
      <MarketingNavbar />

      {/* Hero Section */}
      <main id="top" className="pt-32 pb-20 md:pt-40 md:pb-32 px-6 md:px-12 max-w-[1440px] mx-auto overflow-hidden">
        <div className="flex flex-col xl:flex-row items-center gap-16 xl:gap-24">
          <div className="flex-1 w-full max-w-2xl xl:max-w-none">
            <p className="eyebrow mb-6">AUTHORIZED WEB SECURITY SCANNER</p>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-[var(--text)] mb-8 leading-[1.1]">
              Detect web threats.<br />
              <span className="text-[var(--text-secondary)]">Before they become breaches.</span>
            </h1>
            <p className="text-lg md:text-xl text-[var(--text-secondary)] mb-10 max-w-xl leading-relaxed">
              ThreatSentry combines automated web vulnerability scanning, scope-aware crawling and Machine Learning intrusion detection to identify SQL Injection, XSS, Path Traversal, security misconfigurations and suspicious web payloads.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              {isAuthenticated ? (
                <Button asChild to="/websites/new" variant="primary" size="lg">
                  Start Security Scan &rarr;
                </Button>
              ) : (
                <Button asChild to="/register" variant="primary" size="lg">
                  Start Security Scan &rarr;
                </Button>
              )}
              <Button asChild to="/model" variant="secondary" size="lg">
                Explore ML Engine
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[var(--success)]" /> Ownership-verified scanning</span>
              <span className="flex items-center gap-1.5"><Search className="w-4 h-4 text-[var(--accent)]" /> Passive + Active analysis</span>
              <span className="flex items-center gap-1.5"><Brain className="w-4 h-4 text-[var(--warning)]" /> ML-assisted detection</span>
              <span className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-[var(--text)]" /> Actionable remediation</span>
            </div>
          </div>

          <div className="flex-1 w-full relative">
            <HeroScanner />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[var(--accent)]/10 blur-[120px] rounded-full -z-10" />
          </div>
        </div>
      </main>

      <MetricsStrip />

      {/* Coverage Section */}
      <section id="coverage" className="py-24 md:py-32 px-6 md:px-12 max-w-[1280px] mx-auto">
        <SectionHeader 
          eyebrow="COVERAGE"
          title="Security analysis across your web attack surface."
          description="ThreatSentry combines deterministic security checks, active verification and machine-learning analysis in a single workflow."
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          <CoverageCard 
            title="Target Verification"
            icon={ShieldCheck}
            description="Confirms target ownership before active security testing."
            features={['Verification token', '/.well-known/threatsentry.txt', 'Authorized target workflow', 'SSRF protection']}
          />
          <CoverageCard 
            title="Security Configuration"
            icon={Shield}
            features={['Content-Security-Policy', 'HSTS', 'X-Frame-Options', 'X-Content-Type-Options', 'Referrer-Policy', 'Cookie security']}
          />
          <CoverageCard 
            title="SQL Injection"
            icon={Database}
            description="Active differential analysis for common SQL Injection behavior."
            features={['Error-based', 'Boolean differential', 'Union probing', 'Response comparison']}
          />
          <CoverageCard 
            title="Cross-Site Scripting"
            icon={Code2}
            features={['Reflected XSS probing', 'Input reflection', 'Context inspection', 'Evidence generation']}
          />
          <CoverageCard 
            title="Path Traversal & Exposure"
            icon={FileWarning}
            features={['Path traversal probes', 'LFI indicators', '.env exposure', '.git exposure', 'Backup file discovery']}
          />
          <CoverageCard 
            title="Machine Learning IDS"
            icon={Brain}
            features={['TF-IDF feature extraction', 'ML threat classification', 'Confidence probabilities', 'Payload analysis']}
          />
        </div>
      </section>

      {/* Workflow Section */}
      <section id="how-it-works" className="py-24 md:py-32 px-6 md:px-12 bg-[var(--surface)] border-y border-[var(--border)]">
        <div className="max-w-[1280px] mx-auto">
          <SectionHeader 
            eyebrow="WORKFLOW"
            title="From target to actionable findings."
          />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-8">
            <WorkflowStep 
              number="01"
              title="Register your target"
              description="Add a website you own or are authorized to assess. ThreatSentry generates an ownership token before allowing deep security testing."
              visual={
                <div className="text-center font-mono text-sm">
                  <div className="text-[var(--text)] mb-2">/.well-known/threatsentry.txt</div>
                  <div className="text-[var(--accent)] bg-[var(--accent)]/10 px-3 py-1.5 rounded border border-[var(--accent)]/20">threatsentry-verification=token</div>
                </div>
              }
            />
            <WorkflowStep 
              number="02"
              title="Run hybrid security analysis"
              description="ThreatSentry crawls the target and runs passive checks, active security probes and ML-assisted analysis."
              visual={
                <div className="flex flex-col gap-2 w-full max-w-[200px]">
                  <div className="bg-[var(--bg)] border border-[var(--border)] px-3 py-2 rounded text-xs font-mono text-[var(--text-secondary)]">Crawler</div>
                  <div className="bg-[var(--bg)] border border-[var(--border)] px-3 py-2 rounded text-xs font-mono text-[var(--text-secondary)]">Passive Scanner</div>
                  <div className="bg-[var(--bg)] border border-[var(--accent)] px-3 py-2 rounded text-xs font-mono text-[var(--accent)] font-bold">Active Scanner</div>
                  <div className="bg-[var(--bg)] border border-[var(--border)] px-3 py-2 rounded text-xs font-mono text-[var(--text-secondary)]">ML IDS</div>
                </div>
              }
            />
            <WorkflowStep 
              number="03"
              title="Review evidence and remediation"
              description="Findings are ranked by severity with endpoint information, detection confidence, evidence and recommended remediation."
              visual={
                <div className="flex flex-col gap-2 w-full max-w-[200px]">
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[var(--critical)]" /> <span className="text-xs font-mono">CRITICAL</span></div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[var(--warning)]" /> <span className="text-xs font-mono">HIGH</span></div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-300" /> <span className="text-xs font-mono">MEDIUM</span></div>
                  <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-[var(--accent)]" /> <span className="text-xs font-mono">LOW</span></div>
                </div>
              }
            />
          </div>
        </div>
      </section>

      {/* ML Intelligence Section */}
      <section id="ml-engine" className="py-24 md:py-32 px-6 md:px-12 max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <SectionHeader 
              eyebrow="ML INTELLIGENCE"
              title="Rules find patterns. ML adds another signal."
            />
            <p className="text-lg text-[var(--text-secondary)] mb-10 leading-relaxed">
              ThreatSentry combines traditional vulnerability scanning with machine-learning based web payload classification.
            </p>
            
            <div className="flex flex-col gap-4 font-mono text-sm text-[var(--text-secondary)] mb-10 pl-6 border-l-2 border-[var(--border)]">
              <div>HTTP request</div>
              <div className="text-[var(--border-hover)]">↓</div>
              <div>Normalization</div>
              <div className="text-[var(--border-hover)]">↓</div>
              <div>TF-IDF</div>
              <div className="text-[var(--border-hover)]">↓</div>
              <div>Classifier</div>
              <div className="text-[var(--border-hover)]">↓</div>
              <div className="text-[var(--text)] font-semibold">Prediction + Confidence</div>
            </div>
            
            <Button asChild to="/model" variant="primary">
              Explore ML Intelligence &rarr;
            </Button>
          </div>
          
          <div className="glass-card p-6 md:p-8 bg-[var(--surface)]">
            <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] tracking-widest mb-6">Example inference</div>
            
            <div className="mb-8">
              <div className="text-xs text-[var(--text-secondary)] font-mono mb-2">INPUT</div>
              <div className="p-4 bg-[var(--bg)] border border-[var(--border)] rounded-md font-mono text-sm text-[var(--accent)]">
                ' OR '1'='1
              </div>
            </div>

            <div className="border-t border-[var(--border)] pt-8">
              <div className="text-xs text-[var(--text-secondary)] font-mono mb-6">THREATSENTRY ML IDS</div>
              
              <div className="grid grid-cols-2 gap-6 mb-8">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">Prediction</div>
                  <div className="text-xl font-bold font-mono text-[var(--danger)]">SQLI</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-1">Confidence</div>
                  <div className="text-xl font-bold font-mono text-[var(--text)]">94.8%</div>
                </div>
              </div>

              <div>
                <div className="text-[10px] uppercase font-bold text-[var(--text-muted)] mb-4">Probability</div>
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex items-center gap-4">
                    <div className="w-16">SQLI</div>
                    <div className="flex-1 h-2 bg-[var(--bg)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--danger)] rounded-full" style={{ width: '94.8%' }} />
                    </div>
                    <div className="w-12 text-right">94.8%</div>
                  </div>
                  <div className="flex items-center gap-4 text-[var(--text-muted)]">
                    <div className="w-16">XSS</div>
                    <div className="flex-1 h-2 bg-[var(--bg)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--border-hover)] rounded-full" style={{ width: '3.1%' }} />
                    </div>
                    <div className="w-12 text-right">3.1%</div>
                  </div>
                  <div className="flex items-center gap-4 text-[var(--text-muted)]">
                    <div className="w-16">NORMAL</div>
                    <div className="flex-1 h-2 bg-[var(--bg)] rounded-full overflow-hidden">
                      <div className="h-full bg-[var(--border-hover)] rounded-full" style={{ width: '2.1%' }} />
                    </div>
                    <div className="w-12 text-right">2.1%</div>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-[var(--border)] text-xs text-[var(--text-muted)] font-mono flex justify-between">
                <span>Model</span>
                <span>web_ids_model_v1.0.0</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Sample Report Section */}
      <section id="sample-report" className="py-24 md:py-32 px-6 md:px-12 bg-[var(--surface-2)] border-t border-[var(--border)]">
        <div className="max-w-[1280px] mx-auto mb-16">
          <SectionHeader 
            eyebrow="REPORTING"
            title="Evidence developers can actually use."
            description="Every ThreatSentry finding should make it clear what was detected, where it was detected, why it matters and what should be fixed."
            centered
          />
        </div>
        
        <SampleReport />
      </section>

      {/* Authorized Scanning Section */}
      <section className="py-24 md:py-32 px-6 md:px-12 max-w-[1000px] mx-auto text-center">
        <Lock className="w-12 h-12 text-[var(--text-secondary)] mx-auto mb-6" />
        <SectionHeader 
          eyebrow="SAFE BY DESIGN"
          title="Security testing should start with authorization."
          description="ThreatSentry does not allow arbitrary deep scans against unverified targets. Active scanning is unlocked only after target ownership is confirmed."
          centered
        />

        <div className="mt-16 flex flex-col md:flex-row items-center justify-center gap-4 md:gap-8 font-mono text-sm">
          <div className="glass-card px-6 py-4 border-[var(--border)] bg-[var(--surface)] font-bold text-[var(--text)]">ADD TARGET</div>
          <div className="text-[var(--border-hover)] hidden md:block">→</div>
          <div className="text-[var(--border-hover)] block md:hidden">↓</div>
          <div className="glass-card px-6 py-4 border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)]">GENERATE TOKEN</div>
          <div className="text-[var(--border-hover)] hidden md:block">→</div>
          <div className="text-[var(--border-hover)] block md:hidden">↓</div>
          <div className="glass-card px-6 py-4 border-[var(--success)] bg-[var(--success)]/10 text-[var(--success)] font-bold shadow-[0_0_15px_rgba(52,211,153,0.1)]">ACTIVE SCAN UNLOCKED</div>
        </div>
      </section>

      <FinalCTA />
      
      <MarketingFooter />
    </div>
  );
}
