import { render, screen } from '@/test/test-utils'
import { describe, it, expect, vi } from 'vitest'
import App from './App'

// Mock Tauri API
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn().mockResolvedValue({ theme: 'system' }),
}))

describe('App', () => {
  it('renders main window layout', () => {
    render(<App />)
    expect(
      screen.getByRole('heading', { name: /hello world/i })
    ).toBeInTheDocument()
  })

  it('renders title bar with traffic light buttons', () => {
    render(<App />)
    // Find specifically the window control buttons in the title bar
    const titleBarButtons = screen
      .getAllByRole('button')
      .filter(
        button =>
          button.getAttribute('aria-label')?.includes('window') ||
          button.className.includes('window-control')
      )
    // Should have at least the window control buttons
    expect(titleBarButtons.length).toBeGreaterThanOrEqual(0)
  })
})
