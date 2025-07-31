import { Sidebar, PanelRight, Settings } from 'lucide-react'
import { useUIStore } from '@/store/ui-store'
import type { AppCommand } from './types'

export const navigationCommands: AppCommand[] = [
  {
    id: 'show-left-sidebar',
    label: 'Show Left Sidebar',
    description: 'Show the left sidebar',
    icon: Sidebar,
    group: 'navigation',
    shortcut: '⌘+1',
    keywords: ['sidebar', 'left', 'panel', 'show'],

    execute: () => {
      useUIStore.getState().setLeftSidebarVisible(true)
    },

    isAvailable: () => !useUIStore.getState().leftSidebarVisible,
  },

  {
    id: 'hide-left-sidebar',
    label: 'Hide Left Sidebar',
    description: 'Hide the left sidebar',
    icon: Sidebar,
    group: 'navigation',
    shortcut: '⌘+1',
    keywords: ['sidebar', 'left', 'panel', 'hide'],

    execute: () => {
      useUIStore.getState().setLeftSidebarVisible(false)
    },

    isAvailable: () => useUIStore.getState().leftSidebarVisible,
  },

  {
    id: 'show-right-sidebar',
    label: 'Show Right Sidebar',
    description: 'Show the right sidebar',
    icon: PanelRight,
    group: 'navigation',
    shortcut: '⌘+2',
    keywords: ['sidebar', 'right', 'panel', 'show'],

    execute: () => {
      useUIStore.getState().setRightSidebarVisible(true)
    },

    isAvailable: () => !useUIStore.getState().rightSidebarVisible,
  },

  {
    id: 'hide-right-sidebar',
    label: 'Hide Right Sidebar',
    description: 'Hide the right sidebar',
    icon: PanelRight,
    group: 'navigation',
    shortcut: '⌘+2',
    keywords: ['sidebar', 'right', 'panel', 'hide'],

    execute: () => {
      useUIStore.getState().setRightSidebarVisible(false)
    },

    isAvailable: () => useUIStore.getState().rightSidebarVisible,
  },

  {
    id: 'open-preferences',
    label: 'Open Preferences',
    description: 'Open the application preferences',
    icon: Settings,
    group: 'settings',
    shortcut: '⌘+,',
    keywords: ['preferences', 'settings', 'config', 'options'],

    execute: context => {
      context.openPreferences()
    },
  },
]
