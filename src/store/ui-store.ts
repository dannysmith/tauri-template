import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface UIState {
  // UI visibility states
  sidebarVisible: boolean
  commandPaletteOpen: boolean
  
  // Actions
  toggleSidebar: () => void
  setSidebarVisible: (visible: boolean) => void
  toggleCommandPalette: () => void
  setCommandPaletteOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>()(
  devtools(
    (set) => ({
      // Initial state
      sidebarVisible: true,
      commandPaletteOpen: false,
      
      // Actions
      toggleSidebar: () =>
        set((state) => ({ sidebarVisible: !state.sidebarVisible }), undefined, 'toggleSidebar'),
      
      setSidebarVisible: (visible) =>
        set({ sidebarVisible: visible }, undefined, 'setSidebarVisible'),
      
      toggleCommandPalette: () =>
        set((state) => ({ commandPaletteOpen: !state.commandPaletteOpen }), undefined, 'toggleCommandPalette'),
      
      setCommandPaletteOpen: (open) =>
        set({ commandPaletteOpen: open }, undefined, 'setCommandPaletteOpen'),
    }),
    {
      name: 'ui-store',
    }
  )
)