import { useUIStore } from '@/store/ui-store'
import { notify } from '@/lib/notifications'
import type { CommandContext } from '@/lib/commands/types'

/**
 * Module-level singleton actions safe to call outside React components.
 * Uses getState() at call time, so treat as imperative helpers, not hooks.
 * Note: Store must be initialized before use (always true after app mount).
 */
const commandContext: CommandContext = {
  openPreferences: () => useUIStore.getState().togglePreferences(),
  showToast: (message, type = 'info') =>
    void notify(message, undefined, { type }),
}

/**
 * Command context hook - provides essential actions for commands.
 * Returns a stable reference to avoid unnecessary re-renders.
 */
export function useCommandContext(): CommandContext {
  return commandContext
}
