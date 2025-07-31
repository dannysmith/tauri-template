import { useEffect } from 'react'
import { useUIStore } from '@/store/ui-store'
import { useCommandContext } from './use-command-context'

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
            const { leftSidebarVisible, setLeftSidebarVisible } = useUIStore.getState()
            setLeftSidebarVisible(!leftSidebarVisible)
            break
          }
          case '2': {
            e.preventDefault()
            const { rightSidebarVisible, setRightSidebarVisible } = useUIStore.getState()
            setRightSidebarVisible(!rightSidebarVisible)
            break
          }
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [commandContext])

  // Future: Other global event listeners can be added here
  // useWindowFocusListeners()
  // useMenuEventListeners()
}
