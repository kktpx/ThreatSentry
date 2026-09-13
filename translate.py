import os
import json
import re

files_to_update = [
    "apps/dashboard/src/features/websites/WebsiteDetailPage.tsx",
    "apps/dashboard/src/features/findings/FindingDetailModal.tsx",
    "apps/dashboard/src/features/model/ModelPage.tsx",
    "apps/dashboard/src/features/landing/LandingPage.tsx",
    "apps/dashboard/src/components/marketing/FinalCTA.tsx",
    "apps/dashboard/src/components/marketing/HeroScanner.tsx",
    "apps/dashboard/src/components/marketing/MarketingFooter.tsx",
    "apps/dashboard/src/components/marketing/MarketingNavbar.tsx",
    "apps/dashboard/src/components/marketing/MetricsStrip.tsx",
    "apps/dashboard/src/components/marketing/SampleReport.tsx"
]

def add_use_translation(content):
    if "useTranslation" not in content:
        # Add import
        content = re.sub(r"(import .* from 'lucide-react'\n?)", r"\1import { useTranslation } from 'react-i18next'\n", content, count=1)
        if "import { useTranslation }" not in content:
             content = "import { useTranslation } from 'react-i18next'\n" + content
        
        # Add hook
        content = re.sub(r"(export function \w+\(.*\) {\n?)", r"\1  const { t } = useTranslation()\n", content, count=1)
    return content

replacements = {
    # WebsiteDetailPage.tsx
    "'Ownership verified successfully! You can now start deep scans.'": "t('websiteDetail.verifySuccess')",
    "'Verification challenge could not be confirmed. Check target availability and try again.'": "t('websiteDetail.verifyFailedChallenge')",
    "'Failed to verify website.'": "t('websiteDetail.verifyError')",
    "`Are you sure you want to delete '${website?.name || 'this website'}'? This cannot be undone.`": "t('websiteDetail.deleteConfirm', { name: website?.name || 'this website' })",
    "'Failed to delete website.'": "t('websiteDetail.deleteError')",
    "'Failed to load website details.'": "t('websiteDetail.loadError')",
    "'Failed to start scan.'": "t('websiteDetail.scanStartError')",
    "'Failed to cancel scan.'": "t('websiteDetail.scanCancelError')",
    ">Loading target...<": ">{t('websiteDetail.loadingTarget')}<",
    ">Back to Dashboard<": ">{t('websiteDetail.backToDashboard')}<",
    "Score</div>": "{t('websiteDetail.score')}</div>",
    "'Starting...' : activeScan ? 'Scanning...' : 'Start Scan'": "startingScan ? t('websiteDetail.starting') : activeScan ? t('websiteDetail.scanning') : t('websiteDetail.startScan')",
    "'Verifying...' : 'Verify Target'": "verifying ? t('addWebsite.verifying') : t('websiteDetail.verifyTarget')",
    "title=\"Delete Target\"": "title={t('websiteDetail.deleteTarget')}",
    "Delete\n              </Button>": "{t('common.delete')}\n              </Button>",
    ">Ownership Verification Required<": ">{t('websiteDetail.ownershipRequired')}<",
    "Active scanning is disabled until you prove ownership of this target by publishing a verification token.": "{t('websiteDetail.ownershipDesc')}",
    ">Path:<": ">{t('websiteDetail.path')}<",
    ">Content:<": ">{t('websiteDetail.content')}<",
    ">Tip:</strong> Create a folder named": ">Tip:</strong> {t('addWebsite.folderTip').split('. ')[0] + '.'}",
    "Then, create the": " {t('addWebsite.folderTip').split('. ')[1]}",
    ">Deploy or Push to your server:<": ">{t('addWebsite.deployStep')}<",
    ">If you are using Git (like Vercel, Netlify, GitHub Pages), commit and push the file:<": ">{t('addWebsite.deployDesc')}<",
    "Wait for your deployment to finish before clicking <strong>Verify Target</strong> above.": "{t('addWebsite.deployWait')}",
    ">SCAN IN PROGRESS<": ">{t('websiteDetail.scanInProgress')}<",
    "Stage: {activeScan.current_stage}": "{t('websiteDetail.stage')} {activeScan.current_stage}",
    "'Cancelling...' : 'Cancel'": "cancellingScanId === activeScan.id ? t('common.cancel') : t('common.cancel')",
    ">Findings <span": ">{t('websiteDetail.tabFindings')} <span",
    ">Attack Surface<": ">{t('websiteDetail.tabSurface')}<",
    ">History<": ">{t('websiteDetail.tabHistory')}<",
    ">Severity:<": ">{t('websiteDetail.severityFilter')}<",
    ">No findings<": ">{t('websiteDetail.noFindings')}<",
    "'Run a scan to detect security vulnerabilities.'\n                  : `No findings matching severity '${selectedSeverity}'.`": "t('websiteDetail.noFindingsDesc')\n                  : t('websiteDetail.noFindingsFilter', { severity: selectedSeverity })",
    ">Finding<": ">{t('websiteDetail.colFinding')}<",
    ">Endpoint<": ">{t('websiteDetail.colEndpoint')}<",
    ">Category<": ">{t('websiteDetail.colCategory')}<",
    ">Confidence<": ">{t('websiteDetail.colConfidence')}<",
    ">NEW<": ">{t('websiteDetail.new')}<",
    ">No attack surface data available. Complete a scan first.<": ">{t('websiteDetail.noSurfaceData')}<",
    ">Pages Crawled<": ">{t('websiteDetail.pagesCrawled')}<",
    ">Endpoints<": ">{t('websiteDetail.endpoints')}<",
    ">Forms<": ">{t('websiteDetail.forms')}<",
    ">External<": ">{t('websiteDetail.external')}<",
    "Crawled Pages\n                  </div>": "{t('websiteDetail.crawledPages')}\n                  </div>",
    ">Date<": ">{t('websiteDetail.colDate')}<",
    ">Status<": ">{t('websiteDetail.colStatus')}<",
    ">Stage<": ">{t('websiteDetail.colStage')}<",
    ">Score<": ">{t('websiteDetail.colScore')}<",
    ">Findings<": ">{t('websiteDetail.colFindings')}<",
    "No scans recorded yet.": "{t('websiteDetail.noScans')}",
    "scan.status === 'COMPLETED' ? 'success' : scan.status === 'FAILED' ? 'danger' : scan.status === 'CANCELLED' ? 'default' : 'warning'": "scan.status === 'COMPLETED' ? 'success' : scan.status === 'FAILED' ? 'danger' : scan.status === 'CANCELLED' ? 'default' : 'warning'",
    
    # FindingDetailModal
    "Confidence: {finding.confidence}": "{t('findings.confidence')} {finding.confidence}",
    "Method: {finding.detection_method}": "{t('findings.method')} {finding.detection_method}",
    "ENDPOINT</Badge>": "{t('findings.endpoint')}</Badge>",
    "Param:</span>": "{t('findings.param')}</span>",
    "Description</h3>": "{t('findings.description')}</h3>",
    "Vulnerability Evidence (Sanitized)</h3>": "{t('findings.evidence')}</h3>",
    "Actionable Remediation</h3>": "{t('findings.remediation')}</h3>",
    "Fingerprint: {finding.fingerprint": "{t('findings.fingerprint')} {finding.fingerprint",
    "aria-label=\"Close dialog\"": "aria-label={t('findings.closeDialog')}",
    
    # ModelPage
    ">MACHINE LEARNING INTELLIGENCE<": ">{t('model.eyebrow')}<",
    ">Hybrid Detection Engine & Model Artifacts<": ">{t('model.title')}<",
    "ThreatSentry pairs deterministic protocol rules and HTTP response differential analysis with a character-level TF-IDF classifier trained on the OWASP Core Rule Set and CSIC 2010 benign traffic.": "{t('model.description')}",
    ">Runtime Status<": ">{t('model.runtimeStatus')}<",
    ">Loaded into FastAPI lifespan memory<": ">{t('model.runtimeSublabel')}<",
    ">Test Macro F1<": ">{t('model.testMacroF1')}<",
    ">Zero-leakage test split evaluation<": ">{t('model.testMacroF1Sublabel')}<",
    ">Corpus Samples<": ">{t('model.corpusSamples')}<",
    ">Model Architecture<": ">{t('model.modelArchitecture')}<",
    ">Char TF-IDF (2–5 n-grams)<": ">{t('model.charTfIdf')}<",
    ">Live Model Inference Playground<": ">{t('model.playground')}<",
    "Test the active classifier with real SQLi, XSS, or benign payloads to observe real-time probability distributions.": "{t('model.playgroundDesc')}",
    ">Preset: SQLi<": ">{t('model.presetSqli')}<",
    ">Preset: XSS<": ">{t('model.presetXss')}<",
    ">Preset: Benign<": ">{t('model.presetBenign')}<",
    "placeholder=\"Enter web parameter or payload...\"": "placeholder={t('model.inputPlaceholder')}",
    "classifying ? 'Classifying...' : 'Classify Payload'": "classifying ? t('model.classifying') : t('model.classifyPayload')",
    ">Prediction Result<": ">{t('model.predictionResult')}<",
    "CLASSIFIED AS: {predictionResult.prediction}": "{t('model.classifiedAs')} {predictionResult.prediction}",
    ">Class: NORMAL<": ">{t('model.classNormal')}<",
    "Benign application traffic, standard web queries, clean alphanumeric parameters, and everyday URL parameters.": "{t('model.classNormalDesc')}",
    ">Class: SQLI<": ">{t('model.classSqli')}<",
    "Structured query injection variations including union-based probes, boolean differentials, comment truncations, and stacked queries.": "{t('model.classSqliDesc')}",
    ">Class: XSS<": ">{t('model.classXss')}<",
    "Cross-site scripting vector patterns, event handler injections, unencoded tag breaks, and javascript pseudoprotocol indicators.": "{t('model.classXssDesc')}",
    ">Held-Out Test Set Performance (273 Samples)<": ">{t('model.testPerformance', { count: 273 })}<",
    "Evaluated on strictly isolated test samples with zero structural group overlap to ensure zero data leakage.": "{t('model.testPerformanceDesc')}",
    ">Target Class<": ">{t('model.targetClass')}<",
    ">Precision<": ">{t('model.precision')}<",
    ">Recall<": ">{t('model.recall')}<",
    ">F1-Score<": ">{t('model.f1Score')}<",
    ">Test Support<": ">{t('model.testSupport')}<",
    ">Decision Hierarchy & Safety Invariant<": ">{t('model.decisionHierarchy')}<",
    "In compliance with safety boundaries, ML classification operates as a supportive signal rather than an autonomous decision maker.": "{t('model.decisionDesc')}",
    "The decision matrix below outlines how confidence levels are derived:": "",
    ">Response Evidence<": ">{t('model.responseEvidence')}<",
    ">Rule Match<": ">{t('model.ruleMatch')}<",
    ">ML Probability<": ">{t('model.mlProbability')}<",
    ">Final Confidence<": ">{t('model.finalConfidence')}<",
    ">Method<": ">{t('model.method')}<",
    ">Database error / Unencoded tag<": ">{t('model.dbError')}<",
    ">Status 500 anomaly<": ">{t('model.status500')}<",
    ">No anomaly<": ">{t('model.noAnomaly')}<",
    ">Core Safety Rule:<": ">{t('model.coreSafetyRule')}<",
    "Machine learning predictions alone are mathematically barred from producing a CONFIRMED vulnerability. Confirmation requires deterministic proof such as exposed database error structures or unencoded reflection contexts.": "{t('model.coreSafetyDesc')}",
    
    # LandingPage & Marketing
    ">AUTHORIZED WEB SECURITY SCANNER<": ">{t('landing.heroEyebrow')}<",
    ">Detect web threats.<": ">{t('landing.heroTitle1')}<",
    ">Before they become breaches.<": ">{t('landing.heroTitle2')}<",
    "ThreatSentry combines automated web vulnerability scanning, scope-aware crawling and Machine Learning intrusion detection to identify SQL Injection, XSS, Path Traversal, security misconfigurations and suspicious web payloads.": "{t('landing.heroDesc')}",
    ">Start Security Scan →<": ">{t('landing.startScan')}<",
    ">Explore ML Engine<": ">{t('landing.exploreML')}<",
    ">Ownership-verified scanning<": ">{t('landing.featureOwnership')}<",
    ">Passive + Active analysis<": ">{t('landing.featureHybrid')}<",
    ">ML-assisted detection<": ">{t('landing.featureML')}<",
    ">Actionable remediation<": ">{t('landing.featureRemediation')}<",
    ">COVERAGE<": ">{t('landing.coverageEyebrow')}<",
    ">Security analysis across your web attack surface.<": ">{t('landing.coverageTitle')}<",
    "ThreatSentry combines deterministic security checks, active verification and machine-learning analysis in a single workflow.": "{t('landing.coverageDesc')}",
    ">WORKFLOW<": ">{t('landing.workflowEyebrow')}<",
    ">From target to actionable findings.<": ">{t('landing.workflowTitle')}<",
    ">ML INTELLIGENCE<": ">{t('landing.mlEyebrow')}<",
    ">Rules find patterns. ML adds another signal.<": ">{t('landing.mlTitle')}<",
    ">REPORTING<": ">{t('landing.reportingEyebrow')}<",
    ">Evidence developers can actually use.<": ">{t('landing.reportingTitle')}<",
    ">SAFE BY DESIGN<": ">{t('landing.safetyEyebrow')}<",
    ">Security testing should start with authorization.<": ">{t('landing.safetyTitle')}<",
    
    # Common marketing
    ">Overview<": ">{t('marketing.overview')}<",
    ">Coverage<": ">{t('marketing.coverage')}<",
    ">How It Works<": ">{t('marketing.howItWorks')}<",
    ">Sample Report<": ">{t('marketing.sampleReport')}<",
    ">Sign In<": ">{t('auth.signIn')}<",
    ">Get Started →<": ">{t('marketing.getStarted')}<",
    ">Open Dashboard →<": ">{t('marketing.openDashboard')}<",
    ">Know your attack surface before someone else does.<": ">{t('marketing.ctaTitle')}<",
    "Register an authorized target, verify ownership and let ThreatSentry analyze the application.": "{t('marketing.ctaDesc')}",
    ">Add Target →<": ">{t('marketing.addTarget')}<",
}

for path in files_to_update:
    if not os.path.exists(path):
        continue
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    content = add_use_translation(content)
    
    for k, v in replacements.items():
        if k in content:
            content = content.replace(k, v)
            
    # For WebsiteDetailPage.tsx scanStatus using Helper
    if "WebsiteDetailPage.tsx" in path:
        if "getScanStatusLabel" not in content:
            content = content.replace("import { Button }", "import { getScanStatusLabel } from '../../lib/i18nHelpers'\nimport { Button }")
        content = content.replace("{scan.status}\n                          </Badge>", "{getScanStatusLabel(scan.status)}\n                          </Badge>")
        
    # For MarketingFooter
    if "MarketingFooter.tsx" in path:
        content = content.replace("&copy; {new Date().getFullYear()} ThreatSentry Project", "{t('common.copyright', { year: new Date().getFullYear() })}")
        content = content.replace("Web Vulnerability Scanner & ML IDS.", "{t('auth.loginTagline')}")
        
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    
print("Done translating strings!")
