import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { vi } from 'vitest'

import { LoginPage } from './LoginPage'

const { signInWithPassword } = vi.hoisted(() => ({ signInWithPassword: vi.fn() }))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { signInWithPassword },
  },
}))

it('renders email-password login controls', () => {
  render(<MemoryRouter><LoginPage /></MemoryRouter>)

  expect(screen.getByRole('heading', { name: 'Sign in to ThreatSentry' })).toBeInTheDocument()
  expect(screen.getByLabelText('Email')).toBeInTheDocument()
  expect(screen.getByLabelText('Password')).toBeInTheDocument()
  expect(screen.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/register')
})

it('signs in with the submitted credentials', async () => {
  signInWithPassword.mockResolvedValue({ data: { session: null }, error: null })
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<p>security console</p>} />
      </Routes>
    </MemoryRouter>,
  )

  await user.type(screen.getByLabelText('Email'), 'analyst@example.com')
  await user.type(screen.getByLabelText('Password'), 'secure-password')
  await user.click(screen.getByRole('button', { name: 'Sign in' }))

  expect(signInWithPassword).toHaveBeenCalledWith({
    email: 'analyst@example.com',
    password: 'secure-password',
  })
  expect(await screen.findByText('security console')).toBeInTheDocument()
})
