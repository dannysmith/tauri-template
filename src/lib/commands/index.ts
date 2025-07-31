// Command system exports
export * from './registry'
export * from '../../hooks/use-command-context'
import { navigationCommands } from './navigation-commands'
import { windowCommands } from './window-commands'
import { notificationCommands } from './notification-commands'
import { registerCommands } from './registry'

/**
 * Initialize the command system by registering all commands.
 * This should be called once during app initialization.
 */
export function initializeCommandSystem(): void {
  registerCommands(navigationCommands)
  registerCommands(windowCommands)
  registerCommands(notificationCommands)
  // Future command groups will be registered here

  if (import.meta.env.DEV) {
    console.log('Command system initialized')
  }
}

export { navigationCommands, windowCommands, notificationCommands }
