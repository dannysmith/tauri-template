import { useEffect } from 'react'
import { listen } from '@tauri-apps/api/event'
import { check } from '@tauri-apps/plugin-updater'
import { useUIStore } from '@/store/ui-store'
import { useCommandContext } from './use-command-context'
import { logger } from '@/lib/logger'

/**
 * Main window event listeners - handles global keyboard shortcuts and other app-level events
 *
 * This hook provides a centralized place for all global event listeners, keeping
 * the MainWindow component clean while maintaining good separation of concerns.
 */
export function useMainWindowEventListeners() {
  const commandContext = useCommandContext()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for keyboard shortcuts
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case ',': {
            e.preventDefault()
            commandContext.openPreferences()
            break
          }
          case '1': {
            e.preventDefault()
            const { leftSidebarVisible, setLeftSidebarVisible } =
              useUIStore.getState()
            setLeftSidebarVisible(!leftSidebarVisible)
            break
          }
          case '2': {
            e.preventDefault()
            const { rightSidebarVisible, setRightSidebarVisible } =
              useUIStore.getState()
            setRightSidebarVisible(!rightSidebarVisible)
            break
          }
        }
      }
    }

    // Set up native menu event listeners
    const setupMenuListeners = async () => {
      logger.debug('Setting up menu event listeners')
      const unlisteners = await Promise.all([
        listen('menu-about', () => {
          logger.debug('About menu event received')
          // Show simple about dialog
          const appVersion = '0.1.0' // Could be dynamic from package.json
          alert(
            `Tauri Template App\n\nVersion: ${appVersion}\n\nBuilt with Tauri v2 + React + TypeScript`
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
      ])

      logger.debug(
        `Menu listeners set up successfully: ${unlisteners.length} listeners`
      )
      return unlisteners
    }

    document.addEventListener('keydown', handleKeyDown)

    let menuUnlisteners: (() => void)[] = []
    setupMenuListeners()
      .then(unlisteners => {
        menuUnlisteners = unlisteners
        logger.debug('Menu listeners initialized successfully')
      })
      .catch(error => {
        logger.error('Failed to setup menu listeners:', error)
      })

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      menuUnlisteners.forEach(unlisten => {
        if (unlisten && typeof unlisten === 'function') {
          unlisten()
        }
      })
    }
  }, [commandContext])

  // Future: Other global event listeners can be added here
  // useWindowFocusListeners()
}
