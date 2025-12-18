# Command System

The command system provides a unified way to register and execute actions throughout the app, enabling consistent behavior across keyboard shortcuts, menus, and the command palette.

## Quick Start

### Defining Commands

```typescript
// src/lib/commands/my-feature-commands.ts
import { SomeIcon } from 'lucide-react'
import type { AppCommand } from './types'

export const myFeatureCommands: AppCommand[] = [
  {
    id: 'my-action',
    labelKey: 'commands.myAction.label',
    descriptionKey: 'commands.myAction.description',
    icon: SomeIcon,
    group: 'my-feature',
    shortcut: '⌘+M',
    keywords: ['my', 'action', 'feature'],

    execute: context => {
      context.showToast('Action executed!')
    },

    isAvailable: () => true,
  },
]
```

### Registering Commands

```typescript
// src/lib/commands/index.ts
import { myFeatureCommands } from './my-feature-commands'
import { registerCommands } from './registry'

export function initializeCommandSystem(): void {
  registerCommands(myFeatureCommands)
  // Register other command groups...
}
```

## Architecture

### Command Structure

```typescript
interface AppCommand {
  id: string
  labelKey: string // Translation key (e.g., 'commands.myAction.label')
  descriptionKey?: string // Translation key for description
  icon?: LucideIcon
  group?: string // Grouping for command palette
  keywords?: string[] // Additional search terms
  shortcut?: string // Display shortcut (e.g., '⌘+1')
  execute: (context: CommandContext) => void | Promise<void>
  isAvailable?: (context: CommandContext) => boolean
}
```

### Command Context

The context provides actions commands need without tight coupling:

```typescript
interface CommandContext {
  openPreferences: () => void
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void
}
```

### Registry Pattern

Commands are stored in a central registry:

```typescript
// Register commands (called once at app init)
registerCommands(navigationCommands)

// Get filtered commands (for command palette)
const commands = getAllCommands(context, searchValue, t)

// Execute by ID (returns success/error result)
const result = await executeCommand(commandId, context)
```

**Key Pattern**: Commands use `getState()` in execute functions:

```typescript
// ✅ Good: Direct store access in execute
execute: () => {
  const { leftSidebarVisible, setLeftSidebarVisible } = useUIStore.getState()
  setLeftSidebarVisible(!leftSidebarVisible)
}

// ❌ Bad: Hook usage (would cause re-renders)
const { leftSidebarVisible } = useUIStore()
execute: () => setLeftSidebarVisible(!leftSidebarVisible)
```

## Integration Points

### Command Palette

The command palette (`Cmd+K`) displays all available commands with translated labels:

```typescript
const { t } = useTranslation()
const commands = getAllCommands(commandContext, search, t)

// Render command with translated text
<CommandItem onSelect={() => handleCommandSelect(command.id)}>
  {command.icon && <command.icon />}
  <span>{t(command.labelKey)}</span>
</CommandItem>
```

### Keyboard Shortcuts

Link shortcuts to commands via the command context:

```typescript
// src/hooks/use-keyboard-shortcuts.ts
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

Menu events trigger commands through Tauri events:

```typescript
// React side - in useMainWindowEventListeners
listen('menu-preferences', () => {
  commandContext.openPreferences()
})
```

## Adding New Commands

### Step 1: Add Translation Keys

```json
// locales/en.json
{
  "commands": {
    "myAction": {
      "label": "My Action",
      "description": "Does something useful"
    }
  }
}
```

### Step 2: Create Command File

```typescript
// src/lib/commands/my-feature-commands.ts
export const myFeatureCommands: AppCommand[] = [
  {
    id: 'my-action',
    labelKey: 'commands.myAction.label',
    descriptionKey: 'commands.myAction.description',
    group: 'my-feature',

    execute: context => {
      // Your logic here
      context.showToast('Done!')
    },
  },
]
```

### Step 3: Register in Index

```typescript
// src/lib/commands/index.ts
import { myFeatureCommands } from './my-feature-commands'

export function initializeCommandSystem(): void {
  registerCommands(navigationCommands)
  registerCommands(myFeatureCommands) // Add here
  // ...
}
```

### Step 4: Extend Context (if needed)

```typescript
// src/hooks/use-command-context.ts
export function useCommandContext(): CommandContext {
  return useMemo(
    () => ({
      // ... existing actions
      myNewAction: () => {
        /* implementation */
      },
    }),
    []
  )
}

// Update CommandContext type in types.ts
```

## Command Groups

Organize commands into logical groups (used in command palette headings):

- **navigation**: Sidebar toggles, view switching
- **settings**: Preferences, configuration
- **notifications**: Notification actions
- **window**: Window management (minimize, close, etc.)

Group labels are translated via `commands.group.{groupName}` keys.

## Best Practices

| Do                                                 | Don't                             |
| -------------------------------------------------- | --------------------------------- |
| Use `labelKey` with translation keys               | Hardcode label strings            |
| Use `getState()` in execute functions              | Use hooks in commands             |
| Check `isAvailable` for context-dependent commands | Show unavailable commands         |
| Provide `keywords` for better searchability        | Rely only on label matching       |
| Use `context.showToast()` for feedback             | Silently execute without feedback |
