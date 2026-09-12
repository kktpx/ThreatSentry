import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'

import { AddWebsitePage } from './AddWebsitePage'

const { createWebsite, verifyWebsite } = vi.hoisted(() => ({ createWebsite: vi.fn(), verifyWebsite: vi.fn() }))

vi.mock('../../lib/api', () => ({ createWebsite, verifyWebsite }))

it('creates a website from its display name and URL', async () => {
  createWebsite.mockResolvedValue({ id: 'site-1', verification_token: 'token-value' })
  const user = userEvent.setup()
  render(<AddWebsitePage />)

  await user.type(screen.getByLabelText('Website name'), 'Example Store')
  await user.type(screen.getByLabelText('Website URL'), 'https://example.com')
  await user.click(screen.getByRole('button', { name: 'Add website' }))

  expect(createWebsite).toHaveBeenCalledWith({ name: 'Example Store', url: 'https://example.com' })
  expect(await screen.findByText('threatsentry-verification=token-value')).toBeInTheDocument()
})

it('verifies the website after the ownership file is published', async () => {
  createWebsite.mockResolvedValue({ id: 'site-1', verification_token: 'token-value' })
  verifyWebsite.mockResolvedValue({ verification_status: 'VERIFIED' })
  const user = userEvent.setup()
  render(<AddWebsitePage />)

  await user.type(screen.getByLabelText('Website name'), 'Example Store')
  await user.type(screen.getByLabelText('Website URL'), 'https://example.com')
  await user.click(screen.getByRole('button', { name: 'Add website' }))
  await user.click(await screen.findByRole('button', { name: 'Verify ownership' }))

  expect(verifyWebsite).toHaveBeenCalledWith('site-1')
  expect(await screen.findByText('Ownership verified. You can now start a scan.')).toBeInTheDocument()
})
