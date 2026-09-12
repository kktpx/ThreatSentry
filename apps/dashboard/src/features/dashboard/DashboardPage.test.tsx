import { render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import { DashboardPage } from './DashboardPage'

const { listWebsites } = vi.hoisted(() => ({ listWebsites: vi.fn() }))

vi.mock('../../lib/api', () => ({ listWebsites }))
vi.mock('../auth/authState', () => ({ useAuth: () => ({ signOut: vi.fn() }) }))

it('renders the authenticated user websites', async () => {
  listWebsites.mockResolvedValue([
    { id: 'site-1', name: 'Example Store', normalized_origin: 'https://example.com', verification_status: 'VERIFIED', last_score: 92 },
  ])

  render(<DashboardPage />)

  expect(await screen.findByText('Example Store')).toBeInTheDocument()
  expect(screen.getByText('VERIFIED')).toBeInTheDocument()
  expect(screen.getByText('92 / 100')).toBeInTheDocument()
})
