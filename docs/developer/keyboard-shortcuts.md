# Keyboard Shortcuts

Centralized keyboard shortcut management using native DOM event listeners, integrated with the command system for consistent behavior across the app.

## Quick Start

### Current Shortcuts

- **Cmd+,** (Mac) / **Ctrl+,** (Windows/Linux): Open Preferences
- **Cmd+K** (Mac) / **Ctrl+K** (Windows/Linux): Open Command Palette
- **Cmd+1** (Mac) / **Ctrl+1** (Windows/Linux): Toggle Left Sidebar
- **Cmd+2** (Mac) / **Ctrl+2** (Windows/Linux): Toggle Right Sidebar

### Adding New Shortcuts

```typescript
// src/hooks/useMainWindowEventListeners.ts
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.metaKey || e.ctrlKey) {
    switch (e.key) {
      case '3': {
        e.preventDefault()
        // Your action here
        break
      }
    }
  }
}
```

## Architecture

### Centralized Event Handler

All keyboard shortcuts are managed in one place to prevent conflicts and ensure consistency:

```typescript
// src/hooks/useMainWindowEventListeners.ts
export function useMainWindowEventListeners() {
  const commandContext = useCommandContext()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for modifier keys (Cmd on Mac, Ctrl on Windows/Linux)
      if (e.metaKey || e.ctrlKey) {
        switch (e.key) {
          case ',': {
            e.preventDefault()
            commandContext.openPreferences()
            break
          }
          case '1': {
            e.preventDefault()
            const { leftSidebarVisible, setLeftSidebarVisible } =
              useUIStore.getState()
            setLeftSidebarVisible(!leftSidebarVisible)
            break
          }
          // Add more shortcuts here
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [commandContext])
}
```

### Performance Pattern

**Critical**: Use `getState()` pattern to avoid render cascades:

```typescript
// ✅ Good: Direct store access, stable callback
const handleKeyDown = (e: KeyboardEvent) => {
  if (e.key === '1') {
    const { leftSidebarVisible, setLeftSidebarVisible } = useUIStore.getState()
    setLeftSidebarVisible(!leftSidebarVisible)
  }
}

// ❌ Bad: Store subscription causes re-renders
const { leftSidebarVisible, setLeftSidebarVisible } = useUIStore()
const handleKeyDown = useCallback(
  (e: KeyboardEvent) => {
    if (e.key === '1') {
      setLeftSidebarVisible(!leftSidebarVisible)
    }
  },
  [leftSidebarVisible, setLeftSidebarVisible]
) // Re-creates on every change!
```

## Integration with Native Menus

Keyboard shortcuts are automatically synchronized with native menus:

### Rust Menu Definition

```rust
// src-tauri/src/lib.rs
let app_submenu = SubmenuBuilder::new(app, "Tauri Template")
    .item(
        &MenuItemBuilder::with_id("preferences", "Preferences...")
            .accelerator("CmdOrCtrl+,")  // Matches keyboard shortcut
            .build(app)?,
    )
    .build()?;
```

### Event Synchronization

Both keyboard shortcuts and menu clicks trigger the same actions:

```typescript
// Keyboard shortcut
case ',': {
  e.preventDefault()
  commandContext.openPreferences()
  break
}

// Menu event listener
listen('menu-preferences', () => {
  commandContext.openPreferences()
})
```

## Integration with Command System

Shortcuts integrate seamlessly with the command system:

```typescript
// Commands can be triggered by shortcuts
case 'k': {
  e.preventDefault()
  // Open command palette - command system handles the rest
  setCommandPaletteOpen(true)
  break
}

// Commands can define their own keyboard shortcuts
{
  id: 'toggle-sidebar',
  label: 'Toggle Sidebar',
  // Shortcut shown in command palette UI
  shortcut: 'Cmd+1',
  execute: (context) => {
    const { leftSidebarVisible, setLeftSidebarVisible } = useUIStore.getState()
    setLeftSidebarVisible(!leftSidebarVisible)
  },
}
```

## Why Native DOM Events Instead of react-hotkeys-hook

We initially tried `react-hotkeys-hook` but encountered issues in the Tauri environment where shortcuts wouldn't fire consistently. Native DOM event listeners provide:

- **Reliable execution** in Tauri environment
- **Full control** over event handling
- **Better performance** with direct DOM access
- **Consistent behavior** across platforms

## Shortcut Patterns

### Modifier Key Handling

```typescript
// Cross-platform modifier keys
if (e.metaKey || e.ctrlKey) {
  // Cmd on Mac, Ctrl on Windows/Linux
}

// Mac-specific (if needed)
if (e.metaKey && process.platform === 'darwin') {
  // Mac only
}

// Function keys (no modifier needed)
if (e.key === 'F1') {
  // Function key shortcuts
}
```

### Preventing Default Behavior

Always prevent default browser behavior for custom shortcuts:

```typescript
case ',': {
  e.preventDefault() // Prevents browser's default Cmd+, behavior
  commandContext.openPreferences()
  break
}
```

### Complex Key Combinations

```typescript
// Shift + Cmd + K
if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'K') {
  e.preventDefault()
  // Advanced command palette or developer tools
}

// Alt/Option modifier
if (e.altKey && e.key === 'Enter') {
  e.preventDefault()
  // Alternative action
}
```

## Adding New Shortcuts

### Step 1: Define in Event Handler

```typescript
// src/hooks/useMainWindowEventListeners.ts
case '3': {
  e.preventDefault()
  // Your action - prefer using command context
  commandContext.myNewAction()
  break
}
```

### Step 2: Add to Native Menu (if applicable)

```rust
// src-tauri/src/lib.rs
.item(
  &MenuItemBuilder::with_id("my-action", "My Action")
    .accelerator("CmdOrCtrl+3")
    .build(app)?,
)
```

### Step 3: Add Menu Event Handler

```typescript
// src/hooks/useMainWindowEventListeners.ts
listen('menu-my-action', () => {
  commandContext.myNewAction()
})
```

### Step 4: Update Command Context (if needed)

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
```

## Common Shortcut Conventions

### Standard macOS/Windows Patterns

- **Cmd/Ctrl + ,**: Preferences
- **Cmd/Ctrl + K**: Search/Command Palette
- **Cmd/Ctrl + N**: New
- **Cmd/Ctrl + O**: Open
- **Cmd/Ctrl + S**: Save
- **Cmd/Ctrl + Z**: Undo
- **Cmd/Ctrl + Shift + Z**: Redo

### Sidebar/Panel Toggles

- **Cmd/Ctrl + 1**: Primary sidebar
- **Cmd/Ctrl + 2**: Secondary sidebar/panel
- **Cmd/Ctrl + 3**: Additional panels

### Function Keys

- **F1**: Help
- **F11**: Full screen
- **F12**: Developer tools

## Troubleshooting

### Shortcuts Not Working

1. **Check event listener attachment**: Ensure `useMainWindowEventListeners` is called in `MainWindow`
2. **Verify preventDefault**: Make sure `e.preventDefault()` is called for custom shortcuts
3. **Test modifier keys**: Use browser dev tools to log `e.metaKey` and `e.ctrlKey`

### Conflicts with Browser Shortcuts

Some browser shortcuts may interfere. Use `e.preventDefault()` to override:

```typescript
case 't': {
  e.preventDefault() // Prevents browser's "new tab"
  // Your action
  break
}
```

### Platform-Specific Issues

Test shortcuts on both macOS and Windows/Linux, as modifier key behavior differs:

```typescript
// More robust cross-platform handling
const isModifier = e.metaKey || e.ctrlKey
const isShiftModifier = isModifier && e.shiftKey
```

## Best Practices

1. **Use standard conventions**: Follow platform conventions for common actions
2. **Document shortcuts**: Keep this file updated with new shortcuts
3. **Test across platforms**: Verify shortcuts work on macOS and Windows/Linux
4. **Avoid conflicts**: Check existing shortcuts before adding new ones
5. **Group related shortcuts**: Use logical key groupings (1-9 for panels, letters for actions)
6. **Provide feedback**: Use notifications or UI changes to confirm shortcut execution
