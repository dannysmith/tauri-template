import { describe, it, expect, beforeEach } from 'vitest'
import { useUIStore } from './ui-store'

describe('UIStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useUIStore.setState({
      sidebarVisible: true,
      commandPaletteOpen: false,
    })
  })

  it('has correct initial state', () => {
    const state = useUIStore.getState()
    expect(state.sidebarVisible).toBe(true)
    expect(state.commandPaletteOpen).toBe(false)
  })

  it('toggles sidebar visibility', () => {
    const { toggleSidebar } = useUIStore.getState()
    
    toggleSidebar()
    expect(useUIStore.getState().sidebarVisible).toBe(false)
    
    toggleSidebar()
    expect(useUIStore.getState().sidebarVisible).toBe(true)
  })

  it('sets sidebar visibility directly', () => {
    const { setSidebarVisible } = useUIStore.getState()
    
    setSidebarVisible(false)
    expect(useUIStore.getState().sidebarVisible).toBe(false)
    
    setSidebarVisible(true)
    expect(useUIStore.getState().sidebarVisible).toBe(true)
  })

  it('toggles command palette', () => {
    const { toggleCommandPalette } = useUIStore.getState()
    
    toggleCommandPalette()
    expect(useUIStore.getState().commandPaletteOpen).toBe(true)
    
    toggleCommandPalette()
    expect(useUIStore.getState().commandPaletteOpen).toBe(false)
  })
})