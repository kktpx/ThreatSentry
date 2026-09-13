import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { describe, it, expect, vi } from 'vitest'

import { LandingPage } from './LandingPage'

vi.mock('../auth/authState', () => ({
  useAuth: () => ({ session: null }),
}))

describe('LandingPage', () => {
  it('renders landing page sections', () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
        </Routes>
      </MemoryRouter>
    )

    // Hero
    expect(screen.getByText(/Detect web threats/i)).toBeInTheDocument()
    
    // Coverage
    expect(screen.getByText('Target Verification')).toBeInTheDocument()
    
    // Workflow
    expect(screen.getByText('From target to actionable findings.')).toBeInTheDocument()
    
    // ML Intelligence
    expect(screen.getByText('Rules find patterns. ML adds another signal.')).toBeInTheDocument()
    
    // Demo report
    expect(screen.getByText('demo.threatsentry.local')).toBeInTheDocument()
  })
})
