import { useUIStore } from '@/store/ui-store'
import type { AppCommand } from '@/types/commands'

export const navigationCommands: AppCommand[] = [
  {
    id: 'toggle-sidebar',
    label: 'Toggle Sidebar',
    description: 'Show or hide the sidebar',
    shortcut: 'mod+1',

    execute: context => {
      context.toggleSidebar()
      const isVisible = useUIStore.getState().sidebarVisible
      context.showToast(`Sidebar ${isVisible ? 'shown' : 'hidden'}`, 'success')
    },
  },

  {
    id: 'show-sidebar',
    label: 'Show Sidebar',
    description: 'Show the sidebar',

    execute: context => {
      useUIStore.getState().setSidebarVisible(true)
      context.showToast('Sidebar shown', 'success')
    },

    isAvailable: () => !useUIStore.getState().sidebarVisible,
  },

  {
    id: 'hide-sidebar',
    label: 'Hide Sidebar',
    description: 'Hide the sidebar',

    execute: context => {
      useUIStore.getState().setSidebarVisible(false)
      context.showToast('Sidebar hidden', 'success')
    },

    isAvailable: () => useUIStore.getState().sidebarVisible,
  },

  {
    id: 'toggle-command-palette',
    label: 'Toggle Command Palette',
    description: 'Show or hide the command palette',
    shortcut: 'mod+k',

    execute: context => {
      context.toggleCommandPalette()
      const isOpen = useUIStore.getState().commandPaletteOpen
      context.showToast(
        `Command palette ${isOpen ? 'opened' : 'closed'}`,
        'success'
      )
    },
  },

  {
    id: 'open-preferences',
    label: 'Open Preferences',
    description: 'Open the application preferences',
    shortcut: 'mod+comma',

    execute: context => {
      context.openPreferences()
      context.showToast('Opening preferences...', 'info')
    },
  },
]
