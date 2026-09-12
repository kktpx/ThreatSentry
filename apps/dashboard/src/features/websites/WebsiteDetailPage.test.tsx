import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { WebsiteDetailPage } from './WebsiteDetailPage'

const { getWebsite, listScansForWebsite, startScan, cancelScan, listFindingsForWebsite } = vi.hoisted(() => ({
  getWebsite: vi.fn(),
  listScansForWebsite: vi.fn(),
  startScan: vi.fn(),
  cancelScan: vi.fn(),
  listFindingsForWebsite: vi.fn().mockResolvedValue([]),
}))

vi.mock('../../lib/api', () => ({
  getWebsite,
  listScansForWebsite,
  startScan,
  cancelScan,
  listFindingsForWebsite,
}))

describe('WebsiteDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    listFindingsForWebsite.mockResolvedValue([])
  })

  it('renders verified website details and scan history', async () => {
    getWebsite.mockResolvedValue({
      id: 'site-1',
      name: 'Secure Portal',
      normalized_origin: 'https://secure.example.com',
      verification_status: 'VERIFIED',
      last_score: 95,
    })
    listScansForWebsite.mockResolvedValue([
      {
        id: 'scan-1',
        website_id: 'site-1',
        user_id: 'user-1',
        scan_type: 'DEEP_SCAN',
        status: 'COMPLETED',
        current_stage: 'COMPLETE',
        progress: 100,
        score: 95,
        created_at: '2026-09-12T04:00:00Z',
      },
    ])

    render(
      <MemoryRouter initialEntries={['/websites/site-1']}>
        <Routes>
          <Route path="/websites/:id" element={<WebsiteDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('Secure Portal')).toBeInTheDocument()
    expect(screen.getByText('https://secure.example.com')).toBeInTheDocument()
    expect(screen.getByText('VERIFIED')).toBeInTheDocument()
    expect(screen.getAllByText('95 / 100').length).toBe(2)
    expect(screen.getByRole('button', { name: /start deep scan/i })).toBeInTheDocument()
    expect(screen.getByText(/COMPLETED/)).toBeInTheDocument()
  })

  it('disallows scan initiation for unverified websites', async () => {
    getWebsite.mockResolvedValue({
      id: 'site-2',
      name: 'Unverified Site',
      normalized_origin: 'https://unverified.example.com',
      verification_status: 'UNVERIFIED',
      last_score: null,
    })
    listScansForWebsite.mockResolvedValue([])

    render(
      <MemoryRouter initialEntries={['/websites/site-2']}>
        <Routes>
          <Route path="/websites/:id" element={<WebsiteDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    expect(await screen.findByText('Unverified Site')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /start deep scan/i })).not.toBeInTheDocument()
    expect(screen.getByText(/Ownership Verification Required/i)).toBeInTheDocument()
  })

  it('allows starting and cancelling a scan', async () => {
    getWebsite.mockResolvedValue({
      id: 'site-1',
      name: 'Secure Portal',
      normalized_origin: 'https://secure.example.com',
      verification_status: 'VERIFIED',
      last_score: null,
    })
    listScansForWebsite.mockResolvedValue([])
    startScan.mockResolvedValue({
      id: 'scan-new',
      website_id: 'site-1',
      user_id: 'user-1',
      scan_type: 'DEEP_SCAN',
      status: 'RUNNING',
      current_stage: 'CRAWLING',
      progress: 30,
      created_at: '2026-09-12T04:30:00Z',
    })
    cancelScan.mockResolvedValue({
      id: 'scan-new',
      status: 'CANCELLED',
      current_stage: 'CRAWLING',
      progress: 30,
      finished_at: '2026-09-12T04:31:00Z',
    })

    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/websites/site-1']}>
        <Routes>
          <Route path="/websites/:id" element={<WebsiteDetailPage />} />
        </Routes>
      </MemoryRouter>
    )

    const startBtn = await screen.findByRole('button', { name: /start deep scan/i })
    await user.click(startBtn)

    expect(startScan).toHaveBeenCalledWith('site-1')
    expect(await screen.findByText(/ACTIVE SCAN IN PROGRESS/i)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Stage: CRAWLING/i })).toBeInTheDocument()

    const cancelBtn = screen.getByRole('button', { name: /cancel scan/i })
    await user.click(cancelBtn)

    expect(cancelScan).toHaveBeenCalledWith('scan-new')
    await waitFor(() => {
      expect(screen.getByText('CANCELLED')).toBeInTheDocument()
    })
  })
})
