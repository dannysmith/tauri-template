import { Sidebar, PanelRight, Settings } from 'lucide-react'
import { useUIStore } from '@/store/ui-store'
import type { AppCommand } from './types'

export const navigationCommands: AppCommand[] = [
  {
    id: 'show-left-sidebar',
    labelKey: 'commands.showLeftSidebar.label',
    descriptionKey: 'commands.showLeftSidebar.description',
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
    labelKey: 'commands.hideLeftSidebar.label',
    descriptionKey: 'commands.hideLeftSidebar.description',
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
    labelKey: 'commands.showRightSidebar.label',
    descriptionKey: 'commands.showRightSidebar.description',
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
    labelKey: 'commands.hideRightSidebar.label',
    descriptionKey: 'commands.hideRightSidebar.description',
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
    labelKey: 'commands.openPreferences.label',
    descriptionKey: 'commands.openPreferences.description',
    icon: Settings,
    group: 'settings',
    shortcut: '⌘+,',
    keywords: ['preferences', 'settings', 'config', 'options'],

    execute: context => {
      context.openPreferences()
    },
  },
]
