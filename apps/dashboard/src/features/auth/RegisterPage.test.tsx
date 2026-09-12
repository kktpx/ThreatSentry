import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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
  render(<RegisterPage />)

  await user.type(screen.getByLabelText('Email'), 'new.analyst@example.com')
  await user.type(screen.getByLabelText('Password'), 'secure-password')
  await user.click(screen.getByRole('button', { name: 'Create account' }))

  expect(signUp).toHaveBeenCalledWith({
    email: 'new.analyst@example.com',
    password: 'secure-password',
  })
})

it('links back to sign in', () => {
  render(<RegisterPage />)

  expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/login')
})
