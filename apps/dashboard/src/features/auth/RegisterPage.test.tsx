import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Routes, Route } from 'react-router'
import { vi } from 'vitest'

import { RegisterPage } from './RegisterPage'

const { signUp } = vi.hoisted(() => ({ signUp: vi.fn() }))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: { signUp },
  },
}))

it('registers a user with the submitted credentials', async () => {
  signUp.mockResolvedValue({ data: { user: null }, error: null })
  const user = userEvent.setup()
  render(
    <MemoryRouter initialEntries={['/register']}>
      <Routes>
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<p>security console</p>} />
      </Routes>
    </MemoryRouter>
  )

  await user.type(screen.getByLabelText('Email'), 'new.analyst@example.com')
  await user.type(screen.getByLabelText('Password'), 'secure-password')
  await user.click(screen.getByRole('button', { name: 'Sign Up' }))

  expect(signUp).toHaveBeenCalledWith({
    email: 'new.analyst@example.com',
    password: 'secure-password',
  })
})

it('links back to sign in', () => {
  render(<MemoryRouter><RegisterPage /></MemoryRouter>)

  expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login')
})
