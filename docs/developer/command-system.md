# Command System

The command system provides a unified way to register and execute actions throughout the app, enabling consistent behavior across keyboard shortcuts, menus, and the command palette.

## Quick Start

### Defining Commands

```typescript
// src/lib/commands/navigation-commands.ts
export const navigationCommands: AppCommand[] = [
  {
    id: 'toggle-sidebar',
    label: 'Toggle Sidebar',
    description: 'Show or hide the sidebar',
    icon: Sidebar,
    group: 'navigation',
    execute: (context: CommandContext) => {
      const { leftSidebarVisible, setLeftSidebarVisible } =
        useUIStore.getState()
      setLeftSidebarVisible(!leftSidebarVisible)
    },
    isAvailable: () => true,
  },
]
```

### Registering Commands

```typescript
// src/lib/commands/index.ts
import { navigationCommands } from './navigation-commands'
import { settingsCommands } from './settings-commands'

export function getAllCommands(
  context: CommandContext,
  searchValue = ''
): AppCommand[] {
  const allCommands = [...navigationCommands, ...settingsCommands].filter(
    command => command.isAvailable(context)
  )

  // Filter by search
  if (searchValue) {
    const search = searchValue.toLowerCase()
    return allCommands.filter(
      cmd =>
        cmd.label.toLowerCase().includes(search) ||
        cmd.description?.toLowerCase().includes(search)
    )
  }

  return allCommands
}
```

## Architecture

### Command Structure

Each command follows this interface:

```typescript
interface AppCommand {
  id: string // Unique identifier
  label: string // Display name
  description?: string // Help text for command palette
  icon?: React.ComponentType // Icon for UI
  group: string // Grouping for organization
  execute: (context: CommandContext) => void | Promise<void>
  isAvailable: (context: CommandContext) => boolean
}
```

### Command Context

The context provides all state and actions commands need:

```typescript
export function useCommandContext(): CommandContext {
  const commandContext = useMemo(
    () => ({
      // Direct access to actions (stable references)
      openPreferences: () => {
        window.dispatchEvent(new CustomEvent('open-preferences'))
      },

      showToast: (message: string, type: NotificationType = 'info') => {
        notifications[type]('Command Executed', message)
      },

      // Any other app-wide actions commands might need
    }),
    []
  )

  return commandContext
}
```

**Key Pattern**: Commands use `getState()` directly in their execute functions to avoid render cascades:

```typescript
// ✅ Good: Direct store access
execute: () => {
  const { leftSidebarVisible, setLeftSidebarVisible } = useUIStore.getState()
  setLeftSidebarVisible(!leftSidebarVisible)
}

// ❌ Bad: Would cause unnecessary re-renders
const { leftSidebarVisible, setLeftSidebarVisible } = useUIStore()
execute: () => {
  setLeftSidebarVisible(!leftSidebarVisible)
}
```

## Integration Points

### Command Palette

Commands automatically appear in the command palette (Cmd+K):

```typescript
// src/components/command-palette/CommandPalette.tsx
export function CommandPalette() {
  const [searchValue, setSearchValue] = useState('')
  const commandContext = useCommandContext()
  const commands = getAllCommands(commandContext, searchValue)

  return (
    <Command>
      <CommandInput value={searchValue} onValueChange={setSearchValue} />
      <CommandList>
        {commands.map(command => (
          <CommandItem
            key={command.id}
            onSelect={() => command.execute(commandContext)}
          >
            {command.icon && <command.icon />}
            <span>{command.label}</span>
            {command.description && <span>{command.description}</span>}
          </CommandItem>
        ))}
      </CommandList>
    </Command>
  )
}
```

### Keyboard Shortcuts

Link shortcuts to commands via the command context:

```typescript
// src/hooks/useMainWindowEventListeners.ts
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.metaKey || e.ctrlKey) {
    switch (e.key) {
      case ',': {
        e.preventDefault()
        commandContext.openPreferences()
        break
      }
    }
  }
}
```

### Native Menus

Menu events trigger commands through the event system:

```rust
// src-tauri/src/lib.rs
app.on_menu_event(move |app, event| {
    match event.id().as_ref() {
        "preferences" => {
            let _ = app.emit("menu-preferences", ());
        }
        _ => {}
    }
});
```

```typescript
// React side - in useMainWindowEventListeners
listen('menu-preferences', () => {
  commandContext.openPreferences()
})
```

## Adding New Commands

### Step 1: Create Command Group File

```typescript
// src/lib/commands/my-feature-commands.ts
export const myFeatureCommands: AppCommand[] = [
  {
    id: 'my-action',
    label: 'My Action',
    description: 'Does something useful',
    group: 'my-feature',
    execute: context => {
      // Your logic here
      context.showToast('Action executed!')
    },
    isAvailable: () => true,
  },
]
```

### Step 2: Register Commands

```typescript
// src/lib/commands/index.ts
import { myFeatureCommands } from './my-feature-commands'

export function getAllCommands(context: CommandContext, searchValue = '') {
  const allCommands = [
    ...navigationCommands,
    ...myFeatureCommands, // Add here
    ...settingsCommands,
  ]
  // ... rest of function
}
```

### Step 3: Update Context (if needed)

If your commands need new actions:

```typescript
// src/hooks/use-command-context.ts
export function useCommandContext(): CommandContext {
  return {
    // ... existing actions
    myNewAction: () => {
      // Implementation
    },
  }
}

// Update CommandContext type
interface CommandContext {
  // ... existing properties
  myNewAction: () => void
}
```

## Command Groups

Organize commands into logical groups:

- **navigation**: Sidebar toggles, navigation actions
- **settings**: Preferences, configuration
- **notifications**: Toast/notification tests
- **file**: File operations (when implemented)
- **edit**: Text editing commands (when implemented)

## Best Practices

1. **Keep commands pure**: Commands should only call actions, not contain complex logic
2. **Use descriptive labels**: Clear, action-oriented names for the command palette
3. **Group logically**: Related commands should share a group
4. **Check availability**: Use `isAvailable` to hide commands when they don't apply
5. **Provide feedback**: Use `context.showToast()` to confirm command execution
6. **Stay consistent**: Follow established patterns for similar commands

## Command Context Performance

The command context is designed to be performance-optimized:

- Uses `useMemo` to create stable object references
- Commands access store state via `getState()` to avoid subscriptions
- Event-driven patterns (like `dispatchEvent`) prevent tight coupling

This ensures the command system doesn't cause render cascades or performance issues.
