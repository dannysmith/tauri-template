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
    },
  },

  {
    id: 'show-sidebar',
    label: 'Show Sidebar',
    description: 'Show the sidebar',

    execute: () => {
      useUIStore.getState().setLeftSidebarVisible(true)
    },

    isAvailable: () => !useUIStore.getState().leftSidebarVisible,
  },

  {
    id: 'hide-sidebar',
    label: 'Hide Sidebar',
    description: 'Hide the sidebar',

    execute: () => {
      useUIStore.getState().setLeftSidebarVisible(false)
    },

    isAvailable: () => useUIStore.getState().leftSidebarVisible,
  },

  {
    id: 'toggle-command-palette',
    label: 'Toggle Command Palette',
    description: 'Show or hide the command palette',
    shortcut: 'mod+k',

    execute: context => {
      context.toggleCommandPalette()
    },
  },

  {
    id: 'open-preferences',
    label: 'Open Preferences',
    description: 'Open the application preferences',
    shortcut: 'mod+comma',

    execute: context => {
      context.openPreferences()
    },
  },
]
