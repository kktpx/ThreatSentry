import { render, screen } from '@testing-library/react'
import { ReactNode } from 'react'
import { vi } from 'vitest'

import App from './App'

vi.mock('./features/auth/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: ReactNode }) => children,
}))

vi.mock('./features/dashboard/DashboardPage', () => ({
  DashboardPage: () => <p>Security operations console</p>,
}))

describe('App', () => {
  it('renders the ThreatSentry application shell', () => {
    render(<App />)

    expect(screen.getByText('Security operations console')).toBeInTheDocument()
  })
})
