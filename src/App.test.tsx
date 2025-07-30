import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders main window layout', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: /hello world/i })
    ).toBeInTheDocument()
  })

  it('renders title bar with traffic light buttons', () => {
    render(<App />)
    const buttons = screen.getAllByRole('button')
    // Should have 3 traffic light buttons (close, minimize, maximize)
    expect(buttons).toHaveLength(3)
  })
})
