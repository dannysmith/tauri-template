import { useCallback } from 'react'
import { useUIStore } from '@/store/ui-store'
import { notify } from '@/lib/notifications'
import type { CommandContext } from '@/lib/commands/types'
/**
 * Command context hook - provides essential actions for commands
 */
export function useCommandContext(): CommandContext {
  // Get actions from store using performance-optimized approach
  const { togglePreferences } = useUIStore()

  // Bridge patterns for future features
  const openPreferences = useCallback(() => {
    togglePreferences()
  }, [togglePreferences])

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'info' = 'info') => {
      notify(message, undefined, { type })
    },
    []
  )

  return {
    openPreferences,
    showToast,
  }
}
