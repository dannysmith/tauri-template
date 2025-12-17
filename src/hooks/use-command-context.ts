import { useUIStore } from '@/store/ui-store'
import { notify } from '@/lib/notifications'
import type { CommandContext } from '@/lib/commands/types'

/**
 * Stable singleton context for command execution.
 * These are imperative actions that read current state when called,
 * not reactive values - so they don't need to be recreated per render.
 */
const commandContext: CommandContext = {
  openPreferences: () => useUIStore.getState().togglePreferences(),
  showToast: (message, type = 'info') => notify(message, undefined, { type }),
}

/**
 * Command context hook - provides essential actions for commands.
 * Returns a stable reference to avoid unnecessary re-renders.
 */
export function useCommandContext(): CommandContext {
  return commandContext
}
