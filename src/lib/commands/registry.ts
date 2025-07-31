import type { AppCommand, CommandContext } from './types'

const commandRegistry = new Map<string, AppCommand>()

export function registerCommands(commands: AppCommand[]): void {
  commands.forEach(cmd => commandRegistry.set(cmd.id, cmd))
}

export function getAllCommands(
  context: CommandContext,
  searchValue = ''
): AppCommand[] {
  const allCommands = Array.from(commandRegistry.values()).filter(
    command => !command.isAvailable || command.isAvailable(context)
  )

  if (searchValue.trim()) {
    const search = searchValue.toLowerCase()
    return allCommands.filter(
      cmd =>
        cmd.label.toLowerCase().includes(search) ||
        cmd.description?.toLowerCase().includes(search)
    )
  }

  return allCommands
}
export async function executeCommand(
  commandId: string,
  context: CommandContext
): Promise<{ success: boolean; error?: string }> {
  try {
    const command = commandRegistry.get(commandId)

    if (!command) {
      return {
        success: false,
        error: `Command '${commandId}' not found`,
      }
    }

    if (command.isAvailable && !command.isAvailable(context)) {
      return {
        success: false,
        error: `Command '${commandId}' is not available`,
      }
    }

    await command.execute(context)

    return { success: true }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'

    return {
      success: false,
      error: `Failed to execute command '${commandId}': ${errorMessage}`,
    }
  }
}
