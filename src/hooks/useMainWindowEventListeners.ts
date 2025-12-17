import { useCommandContext } from './use-command-context'
import { useKeyboardShortcuts } from './use-keyboard-shortcuts'
import { useMenuEventListeners } from './use-menu-event-listeners'

/**
 * Main window event listeners - handles global keyboard shortcuts and menu events.
 *
 * This hook composes specialized hooks for different event types:
 * - useKeyboardShortcuts: Global keyboard shortcuts (Cmd+, Cmd+1, Cmd+2)
 * - useMenuEventListeners: Native menu event handlers
 *
 * Keeping this as a single entry point maintains the simple API for MainWindow
 * while allowing better separation of concerns and testability.
 */
export function useMainWindowEventListeners() {
  const commandContext = useCommandContext()

  useKeyboardShortcuts(commandContext)
  useMenuEventListeners(commandContext)
}
