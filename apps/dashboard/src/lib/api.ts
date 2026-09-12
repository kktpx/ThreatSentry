import { supabase } from './supabase'

const apiUrl = (import.meta.env.VITE_API_URL || 'http://localhost:8000').replace(/\/$/, '')

export type Website = {
  id: string
  name: string
  url?: string
  normalized_origin: string
  verification_token?: string
  verification_status: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'FAILED'
  last_score: number | null
}

async function getValidToken(): Promise<string> {
  const { data } = await supabase.auth.getSession()
  let session = data.session
  if (!session?.access_token) {
    throw new Error('Your session has expired. Please sign in again.')
  }

  // Proactively refresh if the access token expires in less than 30 seconds
  const nowInSeconds = Math.floor(Date.now() / 1000)
  if (session.expires_at && session.expires_at - nowInSeconds < 30) {
    try {
      const { data: refreshData, error } = await supabase.auth.refreshSession()
      if (!error && refreshData.session?.access_token) {
        session = refreshData.session
      }
    } catch {
      // If proactive refresh fails, fall through and attempt request
    }
  }

  return session.access_token
}

async function request<T>(path: string, init?: RequestInit, isRetry = false): Promise<T> {
  let token: string
  try {
    token = await getValidToken()
  } catch (err) {
    throw new Error('Your session has expired. Please sign in again.')
  }

  const response = await fetch(`${apiUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    // If token is invalid/expired and we haven't retried yet, attempt refresh & replay
    if (response.status === 401 && !isRetry) {
      try {
        const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
        if (!refreshError && refreshData.session?.access_token) {
          return request<T>(path, init, true)
        }
      } catch {
        // Refresh failed
      }
      // If refresh failed completely, clear stale session
      await supabase.auth.signOut().catch(() => {})
      throw new Error('Your session has expired. Please sign in again.')
    }

    const body = await response.json().catch(() => null)
    throw new Error(body?.detail || 'The request could not be completed.')
  }

  if (response.status === 204) {
    return undefined as unknown as T
  }

  return response.json() as Promise<T>
}

export function listWebsites(): Promise<Website[]> {
  return request<Website[]>('/api/websites')
}

export function createWebsite(input: { name: string; url: string }): Promise<Website & { verification_token: string }> {
  return request<Website & { verification_token: string }>('/api/websites', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function verifyWebsite(websiteId: string): Promise<Website> {
  return request<Website>(`/api/websites/${websiteId}/verify`, { method: 'POST' })
}

export function getWebsite(websiteId: string): Promise<Website> {
  return request<Website>(`/api/websites/${websiteId}`)
}

export function deleteWebsite(websiteId: string): Promise<void> {
  return request<void>(`/api/websites/${websiteId}`, { method: 'DELETE' })
}

export type ScanStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED'

export type ScanJob = {
  id: string
  website_id: string
  user_id: string
  scan_type: string
  status: ScanStatus
  current_stage: string
  progress: number
  started_at?: string | null
  finished_at?: string | null
  error_code?: string | null
  error_message_safe?: string | null
  score?: number | null
  score_formula_version?: string | null
  summary?: {
    grade?: string
    findings_count?: number
    new_findings_count?: number
    unchanged_findings_count?: number
    fixed_findings_count?: number
    scan_type?: string
    message?: string
    attack_surface?: {
      pages_crawled_count?: number
      endpoints_count?: number
      forms_count?: number
      external_domains_count?: number
      pages_crawled?: string[]
      external_domains?: string[]
    }
  }
  created_at: string
}

export function listScansForWebsite(websiteId: string): Promise<ScanJob[]> {
  return request<ScanJob[]>(`/api/websites/${websiteId}/scans`)
}

export function getScan(scanId: string): Promise<ScanJob> {
  return request<ScanJob>(`/api/scans/${scanId}`)
}

export function startScan(websiteId: string): Promise<ScanJob> {
  return request<ScanJob>(`/api/websites/${websiteId}/scans`, { method: 'POST' })
}

export function cancelScan(scanId: string): Promise<ScanJob> {
  return request<ScanJob>(`/api/scans/${scanId}/cancel`, { method: 'POST' })
}

export type FindingSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
export type FindingConfidence = 'POTENTIAL' | 'LIKELY' | 'CONFIRMED'
export type FindingDetectionMethod = 'PASSIVE' | 'ACTIVE' | 'RULE' | 'ML' | 'HYBRID'

export type Finding = {
  id: string
  user_id: string
  website_id: string
  scan_id: string
  title: string
  category: string
  severity: FindingSeverity
  endpoint: string
  parameter: string | null
  description: string
  evidence: Record<string, any>
  recommendation: string
  detection_method: FindingDetectionMethod
  confidence: FindingConfidence
  fingerprint: string
  status: 'NEW' | 'UNCHANGED'
  created_at: string
}

export function listFindingsForScan(scanId: string): Promise<Finding[]> {
  return request<Finding[]>(`/api/scans/${scanId}/findings`)
}

export function listFindingsForWebsite(websiteId: string): Promise<Finding[]> {
  return request<Finding[]>(`/api/websites/${websiteId}/findings`)
}

export function getFinding(findingId: string): Promise<Finding> {
  return request<Finding>(`/api/findings/${findingId}`)
}

