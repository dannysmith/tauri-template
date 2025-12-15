import { useUIStore } from '@/store/ui-store'
import { notify } from '@/lib/notifications'
import type { CommandContext } from '@/lib/commands/types'

/**
 * Command context hook - provides essential actions for commands
 */
export function useCommandContext(): CommandContext {
  // Use getState() pattern to avoid render cascades
  const openPreferences = () => {
    useUIStore.getState().togglePreferences()
  }

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    notify(message, undefined, { type })
  }

  return {
    openPreferences,
    showToast,
  }
}
