import { useCallback } from 'react'
import { useUIStore } from '@/store/ui-store'
import type { CommandContext } from '@/types/commands'
/**
 * Command context hook - provides essential actions for commands
 */
export function useCommandContext(): CommandContext {
  // Get actions from store using performance-optimized approach
  const { toggleLeftSidebar, toggleCommandPalette, togglePreferences } =
    useUIStore()

  // Bridge patterns for future features
  const openPreferences = useCallback(() => {
    togglePreferences()
  }, [togglePreferences])

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      // Dynamic import to avoid importing toast in test environment
      if (typeof window !== 'undefined') {
        import('sonner').then(({ toast }) => {
          toast[type](message)
        })
      }
    },
    []
  )

  return {
    toggleSidebar: toggleLeftSidebar,
    toggleCommandPalette,
    openPreferences,
    showToast,
  }
}
