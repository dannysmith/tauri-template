# Native Menu System

Cross-platform native menu system that integrates with keyboard shortcuts and the command system, providing a consistent user experience across all interaction methods.

## Quick Start

### Current Menu Structure

```
Tauri Template
├── About Tauri Template
├── ────────────────────
├── Check for Updates...
├── ────────────────────
├── Preferences...           (Cmd+,)
├── ────────────────────
├── Hide Tauri Template      (Cmd+H)
├── Hide Others              (Cmd+Alt+H)
├── Show All
├── ────────────────────
└── Quit Tauri Template      (Cmd+Q)

View
├── Toggle Left Sidebar      (Cmd+1)
└── Toggle Right Sidebar     (Cmd+2)
```

### Adding New Menu Items

1. **Add to Rust menu structure**
2. **Add event handler**
3. **Connect to React**

## Architecture

### Rust Menu Definition

```rust
// src-tauri/src/lib.rs
fn create_app_menu(app: &mut tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    // Build the main application submenu
    let app_submenu = SubmenuBuilder::new(app, "Tauri Template")
        .item(&MenuItemBuilder::with_id("about", "About Tauri Template").build(app)?)
        .separator()
        .item(&MenuItemBuilder::with_id("preferences", "Preferences...")
            .accelerator("CmdOrCtrl+,")
            .build(app)?)
        .separator()
        .item(&PredefinedMenuItem::quit(app, Some("Quit Tauri Template"))?)
        .build()?;

    // Build other submenus
    let view_submenu = SubmenuBuilder::new(app, "View")
        .item(&MenuItemBuilder::with_id("toggle-left-sidebar", "Toggle Left Sidebar")
            .accelerator("CmdOrCtrl+1")
            .build(app)?)
        .build()?;

    let menu = MenuBuilder::new(app)
        .item(&app_submenu)
        .item(&view_submenu)
        .build()?;

    app.set_menu(menu)?;
    Ok(())
}
```

### Event Handling Pattern

Menu clicks emit events to React:

```rust
// src-tauri/src/lib.rs - in setup()
app.on_menu_event(move |app, event| {
    log::debug!("Menu event received: {:?}", event.id());

    match event.id().as_ref() {
        "about" => {
            let _ = app.emit("menu-about", ());
        }
        "preferences" => {
            let _ = app.emit("menu-preferences", ());
        }
        "toggle-left-sidebar" => {
            let _ = app.emit("menu-toggle-left-sidebar", ());
        }
        _ => {
            log::debug!("Unhandled menu event: {:?}", event.id());
        }
    }
});
```

### React Event Listeners

```typescript
// src/hooks/useMainWindowEventListeners.ts
const setupMenuListeners = async () => {
  const unlisteners = await Promise.all([
    listen('menu-about', () => {
      // Show simple about dialog
      const appVersion = '0.1.0'
      alert(
        `Tauri Template App\n\nVersion: ${appVersion}\n\nBuilt with Tauri v2 + React + TypeScript`
      )
    }),

    listen('menu-preferences', () => {
      commandContext.openPreferences()
    }),

    listen('menu-toggle-left-sidebar', () => {
      const { leftSidebarVisible, setLeftSidebarVisible } =
        useUIStore.getState()
      setLeftSidebarVisible(!leftSidebarVisible)
    }),
  ])

  return unlisteners
}
```

## Menu Types

### Custom Menu Items

For app-specific actions:

```rust
.item(&MenuItemBuilder::with_id("my-action", "My Action")
    .accelerator("CmdOrCtrl+M")
    .build(app)?)
```

### Predefined Menu Items

Tauri provides common system menu items:

```rust
// Standard macOS/Windows menu items
.item(&PredefinedMenuItem::about(app, None)?)
.item(&PredefinedMenuItem::hide(app, Some("Hide App"))?)
.item(&PredefinedMenuItem::hide_others(app, None)?)
.item(&PredefinedMenuItem::show_all(app, None)?)
.item(&PredefinedMenuItem::quit(app, Some("Quit App"))?)

// Editing menu items
.item(&PredefinedMenuItem::cut(app, None)?)
.item(&PredefinedMenuItem::copy(app, None)?)
.item(&PredefinedMenuItem::paste(app, None)?)
.item(&PredefinedMenuItem::undo(app, None)?)
.item(&PredefinedMenuItem::redo(app, None)?)

// Window management
.item(&PredefinedMenuItem::minimize(app, None)?)
.item(&PredefinedMenuItem::maximize(app, None)?)
.item(&PredefinedMenuItem::fullscreen(app, None)?)
.item(&PredefinedMenuItem::close_window(app, None)?)
```

### Separators

Add visual separation between menu groups:

```rust
.item(&MenuItemBuilder::with_id("item1", "Item 1").build(app)?)
.separator()
.item(&MenuItemBuilder::with_id("item2", "Item 2").build(app)?)
```

## Integration with Command System

Menus integrate with the command system through event-driven architecture:

```typescript
// Menu events trigger the same actions as keyboard shortcuts
listen('menu-preferences', () => {
  commandContext.openPreferences() // Same as Cmd+,
})

// Commands can specify their menu integration
{
  id: 'toggle-sidebar',
  label: 'Toggle Sidebar',
  menuId: 'toggle-left-sidebar', // Links to menu item
  execute: (context) => {
    const { leftSidebarVisible, setLeftSidebarVisible } = useUIStore.getState()
    setLeftSidebarVisible(!leftSidebarVisible)
  },
}
```

## Adding New Menu Items

### Step 1: Add to Rust Menu

```rust
// src-tauri/src/lib.rs - in create_app_menu()
let file_submenu = SubmenuBuilder::new(app, "File")
    .item(&MenuItemBuilder::with_id("new-file", "New File")
        .accelerator("CmdOrCtrl+N")
        .build(app)?)
    .item(&MenuItemBuilder::with_id("open-file", "Open File...")
        .accelerator("CmdOrCtrl+O")
        .build(app)?)
    .build()?;

// Add to main menu
let menu = MenuBuilder::new(app)
    .item(&app_submenu)
    .item(&file_submenu) // Add new submenu
    .item(&view_submenu)
    .build()?;
```

### Step 2: Add Event Handler

```rust
// src-tauri/src/lib.rs - in menu event handler
match event.id().as_ref() {
    "new-file" => {
        let _ = app.emit("menu-new-file", ());
    }
    "open-file" => {
        let _ = app.emit("menu-open-file", ());
    }
    // ... existing handlers
}
```

### Step 3: Add React Listener

```typescript
// src/hooks/useMainWindowEventListeners.ts
const setupMenuListeners = async () => {
  const unlisteners = await Promise.all([
    // ... existing listeners

    listen('menu-new-file', () => {
      commandContext.createNewFile()
    }),

    listen('menu-open-file', () => {
      commandContext.openFileDialog()
    }),
  ])

  return unlisteners
}
```

### Step 4: Update Command Context

```typescript
// src/hooks/use-command-context.ts
export function useCommandContext(): CommandContext {
  return {
    // ... existing actions
    createNewFile: () => {
      // Implementation
    },
    openFileDialog: () => {
      // Implementation
    },
  }
}
```

## Menu Item States

### Enabling/Disabling Items

Currently not implemented, but can be extended:

```rust
// Future: Dynamic menu state updates
#[tauri::command]
pub fn update_menu_item(app: AppHandle, item_id: String, enabled: bool) {
    // Implementation to enable/disable menu items
}
```

### Checkmarks and Icons

Tauri v2 supports menu item checkmarks:

```rust
.item(&MenuItemBuilder::new("Show Debug Info")
    .id("debug-info")
    .checked(true) // Shows checkmark
    .build(app)?)
```

## Platform Differences

### macOS Behavior

- App menu appears in system menu bar
- Standard items (About, Hide, Quit) are expected
- Cmd key accelerators

### Windows/Linux Behavior

- Menu appears in window title bar
- Ctrl key accelerators
- Different standard menu expectations

### Cross-Platform Menu Structure

```rust
// Conditional menu items for different platforms
let mut app_submenu_builder = SubmenuBuilder::new(app, "App");

#[cfg(target_os = "macos")]
{
    app_submenu_builder = app_submenu_builder
        .item(&PredefinedMenuItem::hide(app, None)?)
        .item(&PredefinedMenuItem::hide_others(app, None)?)
        .item(&PredefinedMenuItem::show_all(app, None)?);
}

#[cfg(not(target_os = "macos"))]
{
    // Windows/Linux specific items
    app_submenu_builder = app_submenu_builder
        .item(&MenuItemBuilder::with_id("exit", "Exit")
            .accelerator("Ctrl+Q")
            .build(app)?);
}
```

## Troubleshooting

### Menu Not Appearing

1. **Check menu creation**: Ensure `create_app_menu()` is called in `setup()`
2. **Verify menu structure**: Use proper `SubmenuBuilder` for nested menus
3. **Check logs**: Menu creation errors are logged to console

### Menu Clicks Not Working

1. **Check event emission**: Verify `app.emit()` calls in event handler
2. **Check React listeners**: Ensure `setupMenuListeners()` is called
3. **Verify event names**: Match event names between Rust emit and React listen

### Accelerators Not Working

1. **Check accelerator format**: Use `"CmdOrCtrl+Key"` format
2. **Verify keyboard shortcuts**: Ensure shortcuts work independently
3. **Platform differences**: Test on both macOS and Windows/Linux

## Best Practices

1. **Follow platform conventions**: Use standard menu structures for each platform
2. **Consistent naming**: Match menu item labels with command palette labels
3. **Logical grouping**: Group related items in submenus
4. **Keyboard accelerators**: Provide shortcuts for frequently used items
5. **Event-driven integration**: Use events to decouple menu actions from implementations
6. **Error handling**: Log menu creation and event handling errors
7. **Cross-platform testing**: Test menus on all target platforms

## Future Enhancements

### Dynamic Menu Updates

```rust
// Not yet implemented - future enhancement
#[tauri::command]
pub fn update_menu_item_state(
    app: AppHandle,
    item_id: String,
    enabled: bool,
    checked: bool,
) -> Result<(), String> {
    // Update menu item state dynamically
    Ok(())
}
```

### Context Menus

```rust
// Future: Right-click context menus
pub fn create_context_menu() -> Result<Menu, Box<dyn std::error::Error>> {
    // Context menu implementation
}
```

The menu system provides a native, platform-appropriate interface that integrates seamlessly with keyboard shortcuts and the command system, ensuring users can access functionality through their preferred interaction method.
