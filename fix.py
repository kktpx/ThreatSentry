import os
import re

files_to_fix = [
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

for path in files_to_fix:
    if not os.path.exists(path):
        continue
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
        
    # fix imports
    content = content.replace("import { useTranslation } from 'react-i18next';", "import { useTranslation } from 'react-i18next';\n")
    content = content.replace("'lucide-react'import { useTranslation } from 'react-i18next'", "'lucide-react'\nimport { useTranslation } from 'react-i18next'")
    content = content.replace("import { getScanStatusLabel } from '../../lib/i18nHelpers'\nimport { getScanStatusLabel } from '../../lib/i18nHelpers'", "import { getScanStatusLabel } from '../../lib/i18nHelpers'")
    
    # fix WebsiteDetailPage.tsx specifically
    if "WebsiteDetailPage.tsx" in path:
        content = content.replace("{startingScan ? startingScan ? t('websiteDetail.starting') : activeScan ? t('websiteDetail.scanning') : t('websiteDetail.startScan')}", "{startingScan ? t('websiteDetail.starting') : activeScan ? t('websiteDetail.scanning') : t('websiteDetail.startScan')}")
        content = content.replace("{verifying ? verifying ? t('addWebsite.verifying') : t('websiteDetail.verifyTarget')}", "{verifying ? t('addWebsite.verifying') : t('websiteDetail.verifyTarget')}")
        content = content.replace("{cancellingScanId === activeScan.id ? cancellingScanId === activeScan.id ? t('common.cancel') : t('common.cancel')}", "{cancellingScanId === activeScan.id ? t('common.cancel') : t('common.cancel')}")
        
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
        
print("Fixed files!")
