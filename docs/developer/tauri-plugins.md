# Tauri Plugins

Guide to all Tauri plugins installed in this app, plus built-in features and guidance on when to add more.

## Installed Plugins

### Core Functionality

| Plugin              | Purpose                                 | Frontend Package                  |
| ------------------- | --------------------------------------- | --------------------------------- |
| **single-instance** | Prevents multiple app instances         | None (Rust-only)                  |
| **window-state**    | Saves/restores window position and size | `@tauri-apps/plugin-window-state` |

### File System & Storage

| Plugin              | Purpose                            | Frontend Package            |
| ------------------- | ---------------------------------- | --------------------------- |
| **fs**              | File system access                 | `@tauri-apps/plugin-fs`     |
| **persisted-scope** | Persistent file access permissions | None (Rust-only)            |
| **dialog**          | Native open/save/message dialogs   | `@tauri-apps/plugin-dialog` |

### System Integration

| Plugin                | Purpose                           | Frontend Package                       |
| --------------------- | --------------------------------- | -------------------------------------- |
| **opener**            | Open files/URLs with default apps | `@tauri-apps/plugin-opener`            |
| **clipboard-manager** | Clipboard read/write              | `@tauri-apps/plugin-clipboard-manager` |
| **notification**      | System notifications              | `@tauri-apps/plugin-notification`      |
| **process**           | Exit/restart app                  | `@tauri-apps/plugin-process`           |
| **os**                | OS information                    | `@tauri-apps/plugin-os`                |
| **global-shortcut**   | System-wide keyboard shortcuts    | None (configured in Rust)              |
| **updater**           | In-app updates                    | `@tauri-apps/plugin-updater`           |

### Platform-Specific

| Plugin            | Purpose               | Platform   |
| ----------------- | --------------------- | ---------- |
| **tauri-nspanel** | Native panel behavior | macOS only |

## Plugin Usage Patterns

### Single Instance

Prevents multiple instances of your app from running. When a user tries to open a second instance, the existing window is focused instead.

**Configuration** (`src-tauri/src/lib.rs`):

```rust
#[cfg(desktop)]
{
    app_builder = app_builder.plugin(tauri_plugin_single_instance::init(
        |app, _args, _cwd| {
            if let Some(window) = app.get_webview_window("main") {
                let _ = window.set_focus();
                let _ = window.unminimize();
            }
        },
    ));
}
```

**Important**: This plugin must be registered FIRST in the plugin chain.

### Window State

Automatically saves and restores window position, size, and state (maximized, etc.).

**How it works**:

- Window state is saved when the app closes
- State is restored when the app opens
- Only applies to windows listed in capabilities (main window only, not quick-panes)

**No frontend code needed** - works automatically.

### Context Menus

Native context menus using the built-in Tauri Menu API (no plugin required).

**Usage** (`src/lib/context-menu.ts`):

```typescript
import { showContextMenu, showEditContextMenu } from '@/lib/context-menu'

// Custom menu
await showContextMenu([
  { id: 'copy', label: 'Copy', accelerator: 'CmdOrCtrl+C', action: handleCopy },
  { type: 'separator' },
  { id: 'delete', label: 'Delete', action: handleDelete },
])

// Standard edit menu (Cut, Copy, Paste, Select All)
await showEditContextMenu()

// Text input menu (includes Undo/Redo)
await showTextInputContextMenu()
```

### Dialog

Native file open/save dialogs and message boxes.

```typescript
import { open, save, message, ask, confirm } from '@tauri-apps/plugin-dialog'

// Open file dialog
const file = await open({
  multiple: false,
  filters: [{ name: 'Text', extensions: ['txt', 'md'] }],
})

// Save dialog
const path = await save({
  defaultPath: 'document.txt',
})

// Message box
await message('Operation complete!', { title: 'Success', kind: 'info' })

// Confirmation dialog
const confirmed = await confirm('Are you sure?', {
  title: 'Confirm',
  kind: 'warning',
})
```

### Notifications

System notifications.

```typescript
import { sendNotification } from '@tauri-apps/plugin-notification'

sendNotification({
  title: 'Download Complete',
  body: 'Your file has been downloaded.',
})
```

Or use the typed command:

```typescript
import { commands } from '@/lib/tauri-bindings'
await commands.sendNativeNotification('Title', 'Body text')
```

### Clipboard

Read/write system clipboard.

```typescript
import { writeText, readText } from '@tauri-apps/plugin-clipboard-manager'

await writeText('Hello, clipboard!')
const text = await readText()
```

### Opener

Open files/URLs with the default system application.

```typescript
import { openUrl, openPath } from '@tauri-apps/plugin-opener'

// Open URL in default browser
await openUrl('https://example.com')

// Open file with default app
await openPath('/path/to/document.pdf')
```

## Built-in Features (No Plugin Needed)

### System Tray

Built into Tauri v2 via the `tray-icon` feature. See [Tauri docs](https://v2.tauri.app/learn/system-tray/).

### App Menus

The Menu API is built into `@tauri-apps/api/menu`. This app uses it for:

- Application menu (File, Edit, View, etc.)
- Context menus via `src/lib/context-menu.ts`

## Plugins to Consider Adding

These plugins aren't included by default but are commonly needed:

| Plugin         | When to Add                                                 |
| -------------- | ----------------------------------------------------------- |
| **shell**      | Need to spawn child processes or run terminal commands      |
| **http**       | Making API calls that need to bypass CORS                   |
| **autostart**  | Utility apps that should launch at system startup           |
| **deep-link**  | Custom URL schemes (myapp://path)                           |
| **sql**        | Local SQLite database for structured data                   |
| **positioner** | Tray apps or floating windows that need precise positioning |

## Adding a New Plugin

1. **Install via CLI**:

   ```bash
   npm run tauri add PLUGIN_NAME
   ```

2. **Check placement** in `lib.rs`:
   - `single-instance` must be FIRST
   - Desktop-only plugins should be wrapped in `#[cfg(desktop)]`

3. **Add capability permissions** if needed (check plugin docs)

4. **Create frontend utilities** in `src/lib/` if the plugin needs a wrapper

## Plugin Registration Order

The order plugins are registered matters:

1. **single-instance** - Must be first
2. **window-state** - Before other windowing plugins
3. **updater** - Desktop only
4. All other plugins in any order

## References

- [Tauri v2 Plugin Documentation](https://v2.tauri.app/plugin/)
- [Official Plugins Repository](https://github.com/tauri-apps/plugins-workspace)
- [Window State Plugin](https://v2.tauri.app/plugin/window-state/)
- [Single Instance Plugin](https://v2.tauri.app/plugin/single-instance/)
