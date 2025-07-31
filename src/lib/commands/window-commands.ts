import type { AppCommand } from '@/types/commands'
import { getCurrentWindow } from '@tauri-apps/api/window'

export const windowCommands: AppCommand[] = [
  {
    id: 'window-minimize',
    label: 'Minimize Window',
    description: 'Minimize the current window',
    shortcut: 'mod+m',

    execute: async context => {
      try {
        const appWindow = getCurrentWindow()
        await appWindow.minimize()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        context.showToast(`Failed to minimize window: ${message}`, 'error')
      }
    },
  },

  {
    id: 'window-maximize',
    label: 'Maximize Window',
    description: 'Maximize the current window',

    execute: async context => {
      try {
        const appWindow = getCurrentWindow()
        await appWindow.maximize()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        context.showToast(`Failed to maximize window: ${message}`, 'error')
      }
    },
  },

  {
    id: 'window-toggle-maximize',
    label: 'Toggle Maximize Window',
    description: 'Toggle between maximized and restored window state',
    shortcut: 'mod+shift+enter',

    execute: async context => {
      try {
        const appWindow = getCurrentWindow()
        await appWindow.toggleMaximize()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        context.showToast(
          `Failed to toggle maximize window: ${message}`,
          'error'
        )
      }
    },
  },

  {
    id: 'window-fullscreen',
    label: 'Enter Fullscreen',
    description: 'Enter fullscreen mode',
    shortcut: 'F11',

    execute: async context => {
      try {
        const appWindow = getCurrentWindow()
        await appWindow.setFullscreen(true)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        context.showToast(`Failed to enter fullscreen: ${message}`, 'error')
      }
    },

    // Note: isAvailable is synchronous, so we can't check fullscreen state here
    // The command will handle the state check in the execute function
  },

  {
    id: 'window-exit-fullscreen',
    label: 'Exit Fullscreen',
    description: 'Exit fullscreen mode',
    shortcut: 'Escape',

    execute: async context => {
      try {
        const appWindow = getCurrentWindow()
        await appWindow.setFullscreen(false)
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        context.showToast(`Failed to exit fullscreen: ${message}`, 'error')
      }
    },

    // Note: isAvailable is synchronous, so we can't check fullscreen state here
    // The command will handle the state check in the execute function
  },

  {
    id: 'window-close',
    label: 'Close Window',
    description: 'Close the current window',
    shortcut: 'mod+w',

    execute: async context => {
      try {
        const appWindow = getCurrentWindow()
        await appWindow.close()
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error'
        context.showToast(`Failed to close window: ${message}`, 'error')
      }
    },
  },
]
