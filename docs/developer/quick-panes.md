# Quick Panes

Quick panes are small floating windows that appear via global keyboard shortcut, even when the main application is not focused. This pattern is common for quick entry, command palettes, and similar quick-access features.

## Overview

The quick pane system demonstrates:

- **Global shortcuts** - Trigger from any app with `Cmd+Shift+.` (macOS) or `Ctrl+Shift+.` (Windows/Linux)
- **Multi-window architecture** - Separate React contexts for main window and pane
- **Cross-window communication** - Tauri events for decoupled messaging
- **Platform-specific behavior** - Native NSPanel on macOS for fullscreen overlay

## Architecture

### Multi-Window Setup

Each Tauri window runs a completely separate JavaScript context. They cannot share React state directly.

```
index.html          → src/main.tsx          → Main React app
quick-pane.html     → src/quick-pane-main.tsx → Quick pane React app
```

**Vite configuration** builds both entry points:

```typescript
// vite.config.ts
build: {
  rollupOptions: {
    input: {
      main: resolve(__dirname, 'index.html'),
      'quick-pane': resolve(__dirname, 'quick-pane.html'),
    },
  },
}
```

### Window Creation Pattern

The quick pane is created once at app startup (hidden) and then shown/hidden via commands. This is faster than recreating the window each time and required on macOS because NSPanel must be created on the main thread.

```rust
// In setup() closure - runs on main thread
init_quick_pane(app.handle())?;

// Later, from any command
toggle_quick_pane(app_handle);  // Shows/hides the existing window
```

### Cross-Window Communication

Windows communicate via Tauri events (not shared state):

```typescript
// Quick pane: emit event on submit
await emit('quick-pane-submit', { text: text.trim() })

// Main window: listen for events
listen('quick-pane-submit', ({ payload }) => {
  // Handle the submission - update Zustand, call API, etc.
  setLastQuickPaneEntry(payload.text)
})
```

This pattern is intentionally flexible - the action can be anything:

- Update Zustand store (as demonstrated)
- Call a TanStack Query mutation
- Invoke a Tauri command
- Make an API request

### Theme Synchronization

Since windows don't share React context, theme must be synchronized manually:

```typescript
// Main window: emit when theme changes
emit('theme-changed', { theme })

// Quick pane: listen and apply
listen('theme-changed', () => applyTheme())

// Also re-apply on focus gain (catches changes while hidden)
onFocusChanged(({ payload: focused }) => {
  if (focused) applyTheme()
})
```

## Platform Behavior

| Platform      | Panel Type    | Fullscreen Overlay | Dismiss Behavior            |
| ------------- | ------------- | ------------------ | --------------------------- |
| macOS         | NSPanel       | Yes                | Click-outside, Escape, blur |
| Windows       | Always-on-top | No                 | Escape, blur                |
| Linux X11     | Always-on-top | No                 | Escape, blur                |
| Linux Wayland | Not supported | -                  | -                           |

### macOS NSPanel

On macOS, the quick pane uses `tauri-nspanel` for native panel behavior:

- Appears above fullscreen apps
- Proper focus handling without activating the main app
- Native panel dismissal on focus loss

**Critical configuration for fullscreen overlay:**

```rust
// These settings are required for proper fullscreen behavior.
// See src-tauri/src/commands/quick_pane.rs for the complete builder chain
// which also includes .url(), .title(), .size(), .transparent(), .has_shadow(),
// .with_window() configuration, and .build().

PanelBuilder::<_, QuickPanePanel>::new(app, label)
    .level(PanelLevel::Status)  // High z-order for fullscreen
    .style_mask(StyleMask::empty().nonactivating_panel())  // Required!
    .collection_behavior(
        CollectionBehavior::new()
            .full_screen_auxiliary()
            .can_join_all_spaces(),
    )
    // ... additional builder calls required ...
    .build()
```

The `nonactivating_panel()` style mask is critical for fullscreen overlay visibility.

### Space-Switching Prevention

When hiding the panel on macOS, we must resign key window status first to prevent macOS from activating the main window (which causes space switching):

```rust
panel.resign_key_window();  // Resign BEFORE hiding
panel.hide();
```

## Customization

### Changing the Shortcut

The default shortcut is `CommandOrControl+Shift+.`. Users can customize it in Preferences > General.

Programmatically:

```typescript
await commands.updateQuickPaneShortcut('CommandOrControl+Alt+Space')
// Or reset to default
await commands.updateQuickPaneShortcut(null)
```

### Customizing the Pane Content

Edit `src/components/quick-pane/QuickPaneApp.tsx`:

```typescript
export default function QuickPaneApp() {
  const [text, setText] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (text.trim()) {
      // Emit your custom event
      await emit('quick-pane-submit', {
        action: 'create-task',  // Custom action type
        payload: { text: text.trim() }
      })
      setText('')
    }
    await commands.dismissQuickPane()
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Your custom UI */}
    </form>
  )
}
```

### Wiring to Different Actions

In the main window, handle the event however you need:

```typescript
// Zustand (demonstrated)
listen('quick-pane-submit', ({ payload }) => {
  useUIStore.getState().setLastQuickPaneEntry(payload.text)
})

// TanStack Query mutation
listen('quick-pane-submit', ({ payload }) => {
  createTaskMutation.mutate({ title: payload.text })
})

// API call
listen('quick-pane-submit', async ({ payload }) => {
  await fetch('/api/tasks', {
    method: 'POST',
    body: JSON.stringify({ title: payload.text }),
  })
})

// Tauri command
listen('quick-pane-submit', async ({ payload }) => {
  await commands.createTask(payload.text)
})
```

### Changing Window Size

Update the constants in `src-tauri/src/lib.rs`:

```rust
const QUICK_PANE_WIDTH: f64 = 500.0;
const QUICK_PANE_HEIGHT: f64 = 72.0;
```

Also update the window creation in `init_quick_pane_macos` and `init_quick_pane_standard`.

## Implementation Notes

### Threading (macOS)

NSPanel creation MUST happen on the main thread. The Tauri async runtime uses a tokio thread pool, not the main thread.

```rust
// Bad: async command runs on tokio thread pool
#[tauri::command]
async fn create_panel(app: AppHandle) {
    PanelBuilder::new(...).build()?;  // May crash!
}

// Good: create in setup() which runs on main thread
.setup(|app| {
    init_quick_pane(app.handle())?;
    Ok(())
})
```

### Escape Key Sound

Prevent the system alert sound on Escape by calling `preventDefault()`:

```typescript
const handleKeyDown = async (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    e.preventDefault() // Prevents "boop" sound
    await commands.dismissQuickPane()
  }
}
```

### Window Positioning

The quick pane automatically centers on the monitor containing the mouse cursor. This is handled in the Rust `show_quick_pane` and `toggle_quick_pane` commands.

## Dependencies

```toml
# Cargo.toml

# Global shortcuts
tauri-plugin-global-shortcut = "2"

# macOS NSPanel (conditional)
[target.'cfg(target_os = "macos")'.dependencies]
tauri-nspanel = { git = "https://github.com/ahkohd/tauri-nspanel", branch = "v2.1" }
```

## Limitations

- **Linux Wayland**: Global shortcuts are not supported
- **Visual blur**: Native frosted glass blur is not available due to conflicts between `window-vibrancy` and `tauri-nspanel`. The current implementation uses CSS `backdrop-blur` with semi-transparent backgrounds.
