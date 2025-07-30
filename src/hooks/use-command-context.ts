import { useCallback } from 'react'
import { useUIStore } from '@/store/ui-store'
import type { CommandContext } from '@/types/commands'
/**
 * Command context hook - provides essential actions for commands
 */
export function useCommandContext(): CommandContext {
  // Get actions from store using performance-optimized approach
  const { toggleSidebar, toggleCommandPalette } = useUIStore()

  // Bridge patterns for future features
  const openPreferences = useCallback(() => {
    window.dispatchEvent(new CustomEvent('open-preferences'))
  }, [])

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      console.log(`[${type.toUpperCase()}] ${message}`)
      // Will be replaced with actual toast library
    },
    []
  )

  return {
    toggleSidebar,
    toggleCommandPalette,
    openPreferences,
    showToast,
  }
}
