import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import Landing from './Landing'

describe('landing page', () => {
  it('shows the product promise and account entry points', () => {
    render(<MemoryRouter><Landing /></MemoryRouter>)
    expect(screen.getByRole('heading', { name: /your health history, finally in focus/i })).toBeInTheDocument()
    expect(screen.getAllByRole('link', { name: /create account/i }).length).toBeGreaterThan(0)
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login')
  })
})
