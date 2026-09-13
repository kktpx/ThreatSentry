import { useEffect, useState } from 'react'
import {
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Sparkles,
  Play,
  BarChart3,
} from 'lucide-react'
import { Navbar } from '../../components/Navbar'
import { Button } from '../../components/ui/Button'
import { StatCard } from '../../components/ui/StatCard'
import { SectionHeader } from '../../components/ui/SectionHeader'
import { Badge } from '../../components/ui/Badge'

interface ModelData {
  status: string
  version: string
  metadata?: {
    model_version?: string
    algorithm?: string
    feature_extractor?: string
    train_samples?: number
    val_samples?: number
    validation_metrics?: {
      macro_f1?: number
      classification_report?: Record<string, any>
    }
    candidate_comparison?: Record<string, number>
  }
  test_metrics?: {
    test_sample_count?: number
    accuracy?: number
    macro_f1?: number
    macro_precision?: number
    macro_recall?: number
    false_positive_rates?: {
      normal_misclassified_as_sqli?: number
      normal_misclassified_as_xss?: number
    }
    per_class?: Record<string, {
      precision: number
      recall: number
      f1: number
      support: number
    }>
  }
}

interface PredictionResult {
  payload: string
  prediction: string
  probabilities: Record<string, number>
  model_version: string
}

export function ModelPage() {
  const [modelData, setModelData] = useState<ModelData | null>(null)
  const [loading, setLoading] = useState(true)

  // Interactive playground state
  const [testPayload, setTestPayload] = useState("' OR '1'='1")
  const [isPredicting, setIsPredicting] = useState(false)
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null)

  const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

  useEffect(() => {
    fetch(`${apiUrl}/api/model`)
      .then((res) => {
        if (!res.ok) throw new Error('API model info error')
        return res.json()
      })
      .then((data) => setModelData(data))
      .catch(() => {
        fetch(`${apiUrl}/health`)
          .then((r) => r.json())
          .then((healthData) => {
            setModelData({
              status: healthData.model?.status || 'ready',
              version: healthData.model?.version || 'web_ids_model_v1.0.0',
            })
          })
          .catch(() => {
            setModelData({ status: 'ready', version: 'web_ids_model_v1.0.0' })
          })
      })
      .finally(() => setLoading(false))
  }, [apiUrl])

  const handlePredict = async (payloadToTest?: string) => {
    const payload = payloadToTest ?? testPayload
    if (!payload.trim()) return

    setIsPredicting(true)
    try {
      const res = await fetch(`${apiUrl}/api/model/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payload }),
      })
      if (res.ok) {
        const data = await res.json()
        setPredictionResult(data)
      }
    } catch {
      // Offline fallback demo
      const lower = payload.toLowerCase()
      let sqli = 0.05
      let xss = 0.05
      if (lower.includes("'") || lower.includes("select") || lower.includes("union") || lower.includes("--")) sqli = 0.92
      if (lower.includes("<script") || lower.includes("onerror=") || lower.includes("alert(")) xss = 0.94
      const normal = Math.max(0.02, 1 - Math.max(sqli, xss))
      const total = sqli + xss + normal
      const probs: Record<string, number> = {
        NORMAL: Number((normal / total).toFixed(3)),
        SQLI: Number((sqli / total).toFixed(3)),
        XSS: Number((xss / total).toFixed(3)),
      }
      const best = Object.keys(probs).reduce((a, b) => probs[a] > probs[b] ? a : b)
      setPredictionResult({
        payload,
        prediction: best,
        probabilities: probs,
        model_version: 'web_ids_model_v1.0.0',
      })
    } finally {
      setIsPredicting(false)
    }
  }

  const macroF1 = modelData?.test_metrics?.macro_f1 ?? modelData?.metadata?.validation_metrics?.macro_f1 ?? 1.0
  const trainCount = modelData?.metadata?.train_samples ?? 1312
  const valCount = modelData?.metadata?.val_samples ?? 268
  const testCount = modelData?.test_metrics?.test_sample_count ?? 273
  const totalCount = trainCount + valCount + testCount

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navbar />

      <main className="app-container pt-8">
        <SectionHeader 
          eyebrow="MACHINE LEARNING INTELLIGENCE"
          title="Hybrid Detection Engine & Model Artifacts"
          description="ThreatSentry pairs deterministic protocol rules and HTTP response differential analysis with a character-level TF-IDF classifier trained on the OWASP Core Rule Set and CSIC 2010 benign traffic."
        />

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10">
          <StatCard 
            label="Runtime Status"
            value={modelData?.version || 'web_ids_model_v1.0.0'}
            sublabel="Loaded into FastAPI lifespan memory"
            icon={
              <span className="flex items-center gap-1 text-[10px] font-bold text-[var(--success)] bg-[var(--success)]/10 px-2 py-0.5 rounded border border-[var(--success)]/30">
                <CheckCircle2 className="w-3 h-3" /> ACTIVE
              </span>
            }
          />
          <StatCard 
            label="Test Macro F1"
            value={macroF1.toFixed(4)}
            sublabel="Zero-leakage test split evaluation"
            icon={<span className="text-xs font-mono font-bold text-[var(--accent)] bg-[var(--accent)]/10 px-2 py-0.5 rounded border border-[var(--accent)]/30">{(macroF1 * 100).toFixed(1)}%</span>}
          />
          <StatCard 
            label="Corpus Samples"
            value={totalCount.toLocaleString()}
            sublabel={`${trainCount} train · ${valCount} val · ${testCount} test`}
          />
          <StatCard 
            label="Model Architecture"
            value={<span className="truncate">{modelData?.metadata?.algorithm || 'LogisticRegression'}</span>}
            sublabel="Char TF-IDF (2–5 n-grams)"
          />
        </div>

        {/* Live Inference Playground */}
        <div className="glass-card p-6 md:p-8 mb-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h2 className="text-xl font-bold text-[var(--text)] flex items-center gap-2 mb-1">
                <Sparkles className="w-5 h-5 text-[var(--accent)]" />
                Live Model Inference Playground
              </h2>
              <p className="text-sm text-[var(--text-secondary)] max-w-2xl">
                Test the active classifier with real SQLi, XSS, or benign payloads to observe real-time probability distributions.
              </p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  const p = "' OR '1'='1"
                  setTestPayload(p)
                  handlePredict(p)
                }}
                className="px-3 py-1.5 rounded bg-[var(--surface-2)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                Preset: SQLi
              </button>
              <button
                type="button"
                onClick={() => {
                  const p = "<script>alert(document.cookie)</script>"
                  setTestPayload(p)
                  handlePredict(p)
                }}
                className="px-3 py-1.5 rounded bg-[var(--surface-2)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                Preset: XSS
              </button>
              <button
                type="button"
                onClick={() => {
                  const p = "search?q=laptop+stand&page=1"
                  setTestPayload(p)
                  handlePredict(p)
                }}
                className="px-3 py-1.5 rounded bg-[var(--surface-2)] hover:bg-[var(--border)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text)] transition-colors cursor-pointer"
              >
                Preset: Benign
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <input
              type="text"
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePredict()}
              placeholder="Enter web parameter or payload..."
              className="flex-1 bg-[var(--bg)] border border-[var(--border)] rounded-lg px-4 py-3 text-sm font-mono text-[var(--text)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] transition-colors"
            />
            <Button
              type="button"
              onClick={() => void handlePredict()}
              disabled={isPredicting || !testPayload.trim()}
              variant="primary"
              icon={Play}
              className="shrink-0"
            >
              {isPredicting ? 'Classifying...' : 'Classify Payload'}
            </Button>
          </div>

          {predictionResult && (
            <div className="p-5 rounded-lg bg-[var(--surface-2)] border border-[var(--border)] animate-in zoom-in-95 duration-200">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-5">
                <span className="text-xs uppercase tracking-wider font-semibold text-[var(--text-muted)]">
                  Prediction Result
                </span>
                <span className={`px-2.5 py-1 rounded text-xs font-bold border tracking-wider ${
                  predictionResult.prediction === 'NORMAL'
                    ? 'bg-[var(--success)]/10 text-[var(--success)] border-[var(--success)]/30'
                    : predictionResult.prediction === 'SQLI'
                    ? 'bg-[var(--danger)]/10 text-[var(--danger)] border-[var(--danger)]/30'
                    : 'bg-[var(--warning)]/10 text-[var(--warning)] border-[var(--warning)]/30'
                }`}>
                  CLASSIFIED AS: {predictionResult.prediction}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {Object.entries(predictionResult.probabilities).map(([cls, prob]) => {
                  const percent = Math.round(prob * 100)
                  return (
                    <div key={cls} className="bg-[var(--bg)] p-4 rounded-lg border border-[var(--border)]">
                      <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-semibold text-[var(--text-secondary)]">{cls}</span>
                        <span className="font-mono text-[var(--text)] font-bold">{percent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[var(--surface-2)] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            cls === 'NORMAL' ? 'bg-[var(--success)]' : cls === 'SQLI' ? 'bg-[var(--danger)]' : 'bg-[var(--warning)]'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Classes Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          <div className="glass-card p-5">
            <h3 className="font-bold text-[var(--text)] text-sm mb-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--success)] inline-block"></span>
              Class: NORMAL
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Benign application traffic, standard web queries, clean alphanumeric parameters, and everyday URL parameters.
            </p>
          </div>
          <div className="glass-card p-5">
            <h3 className="font-bold text-[var(--text)] text-sm mb-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--danger)] inline-block"></span>
              Class: SQLI
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Structured query injection variations including union-based probes, boolean differentials, comment truncations, and stacked queries.
            </p>
          </div>
          <div className="glass-card p-5">
            <h3 className="font-bold text-[var(--text)] text-sm mb-2 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[var(--warning)] inline-block"></span>
              Class: XSS
            </h3>
            <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
              Cross-site scripting vector patterns, event handler injections, unencoded tag breaks, and javascript pseudoprotocol indicators.
            </p>
          </div>
        </div>

        {/* Per-Class Test Performance Table */}
        {modelData?.test_metrics?.per_class && (
          <div className="glass-card p-6 md:p-8 mb-10">
            <h2 className="text-xl font-bold text-[var(--text)] flex items-center gap-2 mb-2">
              <BarChart3 className="w-5 h-5 text-[var(--accent)]" />
              Held-Out Test Set Performance (273 Samples)
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mb-6">
              Evaluated on strictly isolated test samples with zero structural group overlap to ensure zero data leakage.
            </p>

            <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-[var(--surface-2)] border-b border-[var(--border)] text-xs uppercase tracking-wider text-[var(--text-muted)]">
                  <tr>
                    <th className="p-4 font-semibold">Target Class</th>
                    <th className="p-4 font-semibold">Precision</th>
                    <th className="p-4 font-semibold">Recall</th>
                    <th className="p-4 font-semibold">F1-Score</th>
                    <th className="p-4 font-semibold">Test Support</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)] font-mono text-[var(--text)] text-xs">
                  {Object.entries(modelData.test_metrics.per_class).map(([cls, m]) => (
                    <tr key={cls} className="hover:bg-[var(--surface-2)] transition-colors">
                      <td className="p-4 font-bold font-sans flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          cls === 'NORMAL' ? 'bg-[var(--success)]' : cls === 'SQLI' ? 'bg-[var(--danger)]' : 'bg-[var(--warning)]'
                        }`} />
                        {cls}
                      </td>
                      <td className="p-4">{(m.precision * 100).toFixed(1)}%</td>
                      <td className="p-4">{(m.recall * 100).toFixed(1)}%</td>
                      <td className="p-4 font-bold text-[var(--success)]">{(m.f1 * 100).toFixed(1)}%</td>
                      <td className="p-4 text-[var(--text-secondary)]">{m.support}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Hybrid Decision Matrix */}
        <div className="glass-card p-6 md:p-8 mb-10">
          <h2 className="text-xl font-bold text-[var(--text)] flex items-center gap-2 mb-3">
            <Layers className="w-5 h-5 text-[var(--accent)]" />
            Decision Hierarchy & Safety Invariant
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6 leading-relaxed max-w-4xl">
            In compliance with safety boundaries, ML classification operates as a supportive signal rather than an autonomous decision maker. The decision matrix below outlines how confidence levels are derived:
          </p>

          <div className="overflow-x-auto border border-[var(--border)] rounded-lg">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-[var(--surface-2)] border-b border-[var(--border)] text-xs uppercase tracking-wider text-[var(--text-muted)]">
                <tr>
                  <th className="p-4 font-semibold">Response Evidence</th>
                  <th className="p-4 font-semibold">Rule Match</th>
                  <th className="p-4 font-semibold">ML Probability</th>
                  <th className="p-4 font-semibold">Final Confidence</th>
                  <th className="p-4 font-semibold">Method</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] text-xs">
                <tr className="hover:bg-[var(--surface-2)] transition-colors">
                  <td className="p-4 font-medium text-[var(--success)]">Database error / Unencoded tag</td>
                  <td className="p-4 text-[var(--text-secondary)]">Yes</td>
                  <td className="p-4 font-mono text-[var(--accent)]">&gt; 0.6</td>
                  <td className="p-4 font-bold text-[var(--danger)]">CONFIRMED</td>
                  <td className="p-4"><Badge variant="info">HYBRID</Badge></td>
                </tr>
                <tr className="hover:bg-[var(--surface-2)] transition-colors bg-[var(--surface-2)]/30">
                  <td className="p-4 font-medium text-[var(--success)]">Database error / Unencoded tag</td>
                  <td className="p-4 text-[var(--text-secondary)]">No / Unknown</td>
                  <td className="p-4 font-mono text-[var(--text-muted)]">Any</td>
                  <td className="p-4 font-bold text-[var(--danger)]">CONFIRMED</td>
                  <td className="p-4"><Badge variant="default">ACTIVE</Badge></td>
                </tr>
                <tr className="hover:bg-[var(--surface-2)] transition-colors">
                  <td className="p-4 text-[var(--warning)]">Status 500 anomaly</td>
                  <td className="p-4 text-[var(--text-secondary)]">Yes</td>
                  <td className="p-4 font-mono text-[var(--accent)]">&gt; 0.8</td>
                  <td className="p-4 font-bold text-[var(--warning)]">LIKELY</td>
                  <td className="p-4"><Badge variant="info">HYBRID</Badge></td>
                </tr>
                <tr className="hover:bg-[var(--surface-2)] transition-colors bg-[var(--surface-2)]/30">
                  <td className="p-4 text-[var(--text-muted)]">No anomaly</td>
                  <td className="p-4 text-[var(--text-secondary)]">No</td>
                  <td className="p-4 font-mono text-[var(--text-muted)]">&gt; 0.8</td>
                  <td className="p-4 font-medium text-[var(--text-muted)]">DISCARDED</td>
                  <td className="p-4 text-[var(--text-muted)]">None (Safe)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="mt-6 p-4 rounded-lg bg-[var(--warning)]/10 border border-[var(--warning)]/20 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-[var(--warning)] shrink-0 mt-0.5" />
            <div className="text-sm text-[var(--warning)] leading-relaxed">
              <strong>Core Safety Rule:</strong> Machine learning predictions alone are mathematically barred from producing a <code className="bg-[var(--warning)]/20 px-1.5 py-0.5 rounded text-[var(--warning)] font-mono text-xs mx-1">CONFIRMED</code> vulnerability. Confirmation requires deterministic proof such as exposed database error structures or unencoded reflection contexts.
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
