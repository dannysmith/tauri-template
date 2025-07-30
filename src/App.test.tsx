import { render, screen } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import App from './App'

describe('App', () => {
  it('renders command system demo', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: /command system demo/i })
    ).toBeInTheDocument()
  })

  it('renders command buttons', () => {
    render(<App />)
    expect(
      screen.getByRole('button', { name: /toggle sidebar/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /toggle command palette/i })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /open preferences/i })
    ).toBeInTheDocument()
  })
})
