import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { vi } from 'vitest'

import { AddWebsitePage } from './AddWebsitePage'

const { createWebsite, verifyWebsite } = vi.hoisted(() => ({ createWebsite: vi.fn(), verifyWebsite: vi.fn() }))

vi.mock('../../lib/api', () => ({ createWebsite, verifyWebsite }))

it('creates a website from its display name and URL', async () => {
  createWebsite.mockResolvedValue({ id: 'site-1', verification_token: 'token-value' })
  const user = userEvent.setup()
  render(<MemoryRouter><AddWebsitePage /></MemoryRouter>)

  await user.type(screen.getByLabelText(/Website Name/i), 'Example Store')
  await user.type(screen.getByLabelText(/Website URL/i), 'https://example.com')
  await user.click(screen.getByRole('button', { name: /Continue to Verification/i }))

  expect(createWebsite).toHaveBeenCalledWith({ name: 'Example Store', url: 'https://example.com' })
  expect(await screen.findByText('threatsentry-verification=token-value')).toBeInTheDocument()
})

it('verifies the website after the ownership file is published', async () => {
  createWebsite.mockResolvedValue({ id: 'site-1', verification_token: 'token-value' })
  verifyWebsite.mockResolvedValue({ verification_status: 'VERIFIED' })
  const user = userEvent.setup()
  render(<MemoryRouter><AddWebsitePage /></MemoryRouter>)

  await user.type(screen.getByLabelText(/Website Name/i), 'Example Store')
  await user.type(screen.getByLabelText(/Website URL/i), 'https://example.com')
  await user.click(screen.getByRole('button', { name: /Continue to Verification/i }))
  await user.click(await screen.findByRole('button', { name: /Verify Ownership/i }))

  expect(verifyWebsite).toHaveBeenCalledWith('site-1')
  expect(await screen.findByText(/Target Verified/i)).toBeInTheDocument()
})
