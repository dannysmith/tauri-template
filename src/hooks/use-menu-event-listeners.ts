import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import { check } from '@tauri-apps/plugin-updater'
import { useUIStore } from '@/store/ui-store'
import { logger } from '@/lib/logger'
import type { CommandContext } from '@/lib/commands/types'

/**
 * Handles native menu event listeners.
 *
 * Listens for events emitted by the application menu:
 * - menu-about: Shows the about dialog
 * - menu-check-updates: Checks for application updates
 * - menu-preferences: Opens preferences
 * - menu-toggle-left-sidebar: Toggles left sidebar
 * - menu-toggle-right-sidebar: Toggles right sidebar
 * - quick-pane-submit: Handles quick pane text submission
 */
export function useMenuEventListeners(commandContext: CommandContext) {
  useEffect(() => {
    // Track mounted state and resolved unlisteners to handle race conditions
    let isMounted = true
    let resolvedUnlisteners: (() => void)[] | null = null

    const setupMenuListeners = async () => {
      logger.debug('Setting up menu event listeners')
      const unlisteners = await Promise.all([
        listen('menu-about', () => {
          logger.debug('About menu event received')
          alert(
            `Tauri Template App\n\nVersion: ${__APP_VERSION__}\n\nBuilt with Tauri v2 + React + TypeScript`
          )
        }),

        listen('menu-check-updates', async () => {
          logger.debug('Check for updates menu event received')
          try {
            const update = await check()
            if (update) {
              commandContext.showToast(
                `Update available: ${update.version}`,
                'info'
              )
            } else {
              commandContext.showToast(
                'You are running the latest version',
                'success'
              )
            }
          } catch (error) {
            logger.error('Update check failed:', { error: String(error) })
            commandContext.showToast('Failed to check for updates', 'error')
          }
        }),

        listen('menu-preferences', () => {
          logger.debug('Preferences menu event received')
          commandContext.openPreferences()
        }),

        listen('menu-toggle-left-sidebar', () => {
          logger.debug('Toggle left sidebar menu event received')
          const { leftSidebarVisible, setLeftSidebarVisible } =
            useUIStore.getState()
          setLeftSidebarVisible(!leftSidebarVisible)
        }),

        listen('menu-toggle-right-sidebar', () => {
          logger.debug('Toggle right sidebar menu event received')
          const { rightSidebarVisible, setRightSidebarVisible } =
            useUIStore.getState()
          setRightSidebarVisible(!rightSidebarVisible)
        }),

        listen<{ text: string }>('quick-pane-submit', event => {
          logger.debug('Quick pane submit event received', {
            text: event.payload.text,
          })
          const { setLastQuickPaneEntry } = useUIStore.getState()
          setLastQuickPaneEntry(event.payload.text)
        }),
      ])

      logger.debug(
        `Menu listeners set up successfully: ${unlisteners.length} listeners`
      )
      return unlisteners
    }

    setupMenuListeners()
      .then(unlisteners => {
        // If already unmounted, immediately unsubscribe
        if (!isMounted) {
          unlisteners.forEach(unlisten => unlisten())
        } else {
          resolvedUnlisteners = unlisteners
          logger.debug('Menu listeners initialized successfully')
        }
      })
      .catch(error => {
        logger.error('Failed to setup menu listeners:', error)
      })

    return () => {
      isMounted = false
      // If unlisteners have resolved, call them; otherwise they will be
      // cleaned up in the .then() handler when the promise resolves
      if (resolvedUnlisteners) {
        resolvedUnlisteners.forEach(unlisten => unlisten())
      }
    }
  }, [commandContext])
}
