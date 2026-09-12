import { act, render, screen } from '@testing-library/react'
import { vi } from 'vitest'

import { AuthProvider, useAuth } from './authState'

const { getSession, onAuthStateChange } = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: { auth: { getSession, onAuthStateChange } },
}))

function SessionState() {
  const { isLoading, session } = useAuth()
  return <p>{isLoading ? 'loading' : session ? 'authenticated' : 'anonymous'}</p>
}

it('restores an existing Supabase session before exposing auth state', async () => {
  getSession.mockResolvedValue({ data: { session: { access_token: 'token' } } })
  onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })

  render(<AuthProvider><SessionState /></AuthProvider>)

  expect(screen.getByText('loading')).toBeInTheDocument()
  await act(async () => {})
  expect(screen.getByText('authenticated')).toBeInTheDocument()
})
