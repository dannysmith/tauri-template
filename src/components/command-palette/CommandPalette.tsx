import { useEffect, useState, useCallback, useMemo } from 'react'
import { useUIStore } from '@/store/ui-store'
import { useCommandContext } from '@/hooks/use-command-context'
import { getAllCommands, executeCommand } from '@/lib/commands'
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandShortcut,
} from '@/components/ui/command'

export function CommandPalette() {
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore()
  const commandContext = useCommandContext()
  const [search, setSearch] = useState('')

  // Get all available commands (memoized to prevent re-filtering on every render)
  const commandGroups = useMemo(() => {
    const commands = getAllCommands(commandContext, search)

    // Group commands by their group property
    return commands.reduce(
      (groups, command) => {
        const group = command.group || 'other'
        if (!groups[group]) {
          groups[group] = []
        }
        groups[group].push(command)
        return groups
      },
      {} as Record<string, typeof commands>
    )
  }, [commandContext, search])

  // Handle command execution
  const handleCommandSelect = useCallback(
    async (commandId: string) => {
      setCommandPaletteOpen(false)
      setSearch('') // Clear search when closing

      const result = await executeCommand(commandId, commandContext)

      if (!result.success && result.error) {
        commandContext.showToast(result.error, 'error')
      }
    },
    [commandContext, setCommandPaletteOpen]
  )

  // Keyboard shortcut handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandPaletteOpen(!commandPaletteOpen)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [commandPaletteOpen, setCommandPaletteOpen])

  // Clear search when dialog opens
  useEffect(() => {
    if (commandPaletteOpen) {
      setSearch('')
    }
  }, [commandPaletteOpen])

  return (
    <CommandDialog
      open={commandPaletteOpen}
      onOpenChange={setCommandPaletteOpen}
      title="Command Palette"
      description="Type a command or search..."
    >
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {Object.entries(commandGroups).map(([groupName, groupCommands]) => (
          <CommandGroup key={groupName} heading={getGroupLabel(groupName)}>
            {groupCommands.map(command => (
              <CommandItem
                key={command.id}
                value={command.id}
                onSelect={() => handleCommandSelect(command.id)}
              >
                {command.icon && <command.icon className="mr-2 h-4 w-4" />}
                <span>{command.label}</span>
                {command.description && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {command.description}
                  </span>
                )}
                {command.shortcut && (
                  <CommandShortcut>{command.shortcut}</CommandShortcut>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
}

// Helper function to get readable group labels
function getGroupLabel(groupName: string): string {
  switch (groupName) {
    case 'navigation':
      return 'Navigation'
    case 'settings':
      return 'Settings'
    case 'window':
      return 'Window'
    case 'notification':
      return 'Notifications'
    case 'other':
      return 'Other'
    default:
      return groupName.charAt(0).toUpperCase() + groupName.slice(1)
  }
}

export default CommandPalette
