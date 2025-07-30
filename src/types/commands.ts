// Command context provides all state and actions commands need
export interface CommandContext {
  // UI State actions
  toggleSidebar: () => void
  toggleCommandPalette: () => void

  // Bridge patterns for future features
  openPreferences: () => void
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}

// Core command interface following the architectural pattern
export interface AppCommand {
  id: string
  label: string
  description?: string

  // Execute function receives context for accessing state/actions
  execute: (context: CommandContext) => void | Promise<void>

  // Dynamic availability based on current context
  isAvailable?: (context: CommandContext) => boolean

  // Optional keyboard shortcut for future implementation
  shortcut?: string
}
