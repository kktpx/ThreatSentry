import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { vi } from 'vitest'

import { AuthProvider } from './authState'
import { ProtectedRoute } from './ProtectedRoute'

const { getSession, onAuthStateChange } = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
}))

vi.mock('../../lib/supabase', () => ({
  supabase: { auth: { getSession, onAuthStateChange } },
}))

it('redirects an anonymous visitor to login', async () => {
  getSession.mockResolvedValue({ data: { session: null } })
  onAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } })

  render(
    <AuthProvider>
      <MemoryRouter initialEntries={['/dashboard']}>
        <Routes>
          <Route path="/dashboard" element={<ProtectedRoute><p>private console</p></ProtectedRoute>} />
          <Route path="/login" element={<p>login page</p>} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  )

  expect(await screen.findByText('login page')).toBeInTheDocument()
})
