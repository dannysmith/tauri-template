# Tauri Plugins Enhancement

## Overview

Add commonly-needed Tauri v2 plugins with idiomatic patterns and comprehensive documentation. This task includes creating a developer guide for all plugins (existing and new).

## Research Summary

### Current Plugins (Already Installed)

| Plugin            | Purpose                                  | Status     |
| ----------------- | ---------------------------------------- | ---------- |
| opener            | Open files/URLs with system default apps | ✅ Working |
| clipboard-manager | Clipboard read/write                     | ✅ Working |
| dialog            | Native open/save/message dialogs         | ✅ Working |
| fs                | File system access                       | ✅ Working |
| log               | Configurable logging                     | ✅ Working |
| notification      | System notifications                     | ✅ Working |
| persisted-scope   | Persistent file access permissions       | ✅ Working |
| process           | Exit/restart app                         | ✅ Working |
| os                | OS info                                  | ✅ Working |
| global-shortcut   | System-wide keyboard shortcuts           | ✅ Working |
| updater           | In-app updates (desktop)                 | ✅ Working |
| tauri-nspanel     | macOS native panels (custom)             | ✅ Working |

### Plugins to Add

| Plugin              | Priority  | Rationale                                                                   |
| ------------------- | --------- | --------------------------------------------------------------------------- |
| **window-state**    | Essential | Users expect windows to reopen where they left them                         |
| **single-instance** | Essential | Prevent multiple app instances - standard desktop UX                        |
| **store**           | High      | Simple key-value storage for ad-hoc data (complements existing preferences) |

### Built-in Features (No Plugin Needed)

- **Context menus**: Menu API has `popup()` method in Tauri v2
- **System tray**: Built into Tauri v2 via `tray-icon` feature

### Plugins NOT Adding (Documented Only)

| Plugin     | When to Add                           |
| ---------- | ------------------------------------- |
| shell      | Apps needing to spawn child processes |
| http       | API calls bypassing CORS              |
| autostart  | Utility apps that launch at startup   |
| deep-link  | Custom URL schemes (myapp://)         |
| sql        | Local SQLite database                 |
| positioner | Tray apps, floating windows           |

## Architecture Decision: Store Plugin vs Custom Preferences

**Decision: Keep both, use for different purposes**

### Current Preferences System (Keep)

- **Purpose**: Strongly-typed app settings
- **Why keep**: Already well-implemented with atomic writes, type-safe via tauri-specta, integrated with TanStack Query, supports Rust-side validation
- **Use for**: Theme, keyboard shortcuts, any setting that benefits from type safety

### Store Plugin (Add)

- **Purpose**: Simple key-value storage for ad-hoc data
- **Why add**: Less boilerplate for simple data, lazy loading, auto-save with debounce, battle-tested official solution
- **Use for**: Recent files, window preferences, feature flags, cached API responses, user preferences that don't need validation

### Decision Flowchart

```
Need to persist data?
├─ Strongly typed with validation? → Use Preferences (TanStack Query + Rust)
├─ Simple key-value pairs? → Use Store plugin
└─ Emergency/crash recovery? → Use Recovery system (existing)
```

---

## Implementation Plan

### Phase 1: Single Instance Plugin

**IMPORTANT**: Must be registered FIRST in the builder chain, before other plugins.

**Installation:**

```bash
npm run tauri add single-instance
```

**Rust setup (lib.rs) - Add at TOP of plugin chain:**

```rust
pub fn run() {
    let builder = bindings::generate_bindings();

    #[cfg(debug_assertions)]
    bindings::export_ts_bindings();

    // Start building with single-instance FIRST
    let mut app_builder = tauri::Builder::default();

    // Single instance must be first plugin registered
    #[cfg(desktop)]
    {
        app_builder = app_builder.plugin(tauri_plugin_single_instance::init(
            |app, _args, _cwd| {
                // Focus existing window when user tries to open second instance
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.set_focus();
                    let _ = window.unminimize();
                }
            },
        ));
    }

    // Then add other plugins...
    app_builder = app_builder
        .plugin(tauri_plugin_updater::Builder::new().build())
        // ... rest of plugins
```

**Files to modify:**

- `src-tauri/Cargo.toml` - Add dependency
- `src-tauri/src/lib.rs` - Restructure plugin registration order

**No frontend changes needed** - Rust-only plugin.

### Phase 2: Window State Plugin

Automatically save/restore window position and size.

**Installation:**

```bash
npm run tauri add window-state
```

**Rust setup (lib.rs) - Add in builder chain:**

```rust
use tauri_plugin_window_state::{AppHandleExt, StateFlags, WindowExt};

// In the builder chain (after single-instance, before other plugins)
app_builder = app_builder
    .plugin(tauri_plugin_window_state::Builder::default().build())
```

**IMPORTANT**: Exclude quick-pane from state restoration in setup:

```rust
.setup(|app| {
    // ... existing setup code ...

    // Restore window state for main window only
    // Quick-pane is excluded because it uses dynamic positioning
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.restore_state(StateFlags::all());
    }

    Ok(())
})
```

**Update capabilities (default.json):**

```json
{
  "permissions": [
    // ... existing permissions ...
    "window-state:default"
  ]
}
```

**Files to modify:**

- `src-tauri/Cargo.toml`
- `src-tauri/src/lib.rs`
- `src-tauri/capabilities/default.json`

**No frontend package needed** - works automatically for main window.

### Phase 3: Store Plugin

Add simple key-value storage for ad-hoc data, accessible from both Rust and frontend.

**Installation:**

```bash
npm run tauri add store
```

**Rust setup (lib.rs):**

```rust
use tauri_plugin_store::StoreExt;

// In the builder chain
app_builder = app_builder
    .plugin(tauri_plugin_store::Builder::default().build())
```

**Example Rust usage (in setup or commands):**

```rust
use serde_json::json;

// Create/load a store
let store = app.store("app-data.json")?;

// Set a value (must be serde_json::Value for JS compatibility)
store.set("last_opened_file", json!("/path/to/file.txt"));

// Get a value
if let Some(value) = store.get("last_opened_file") {
    log::info!("Last opened: {}", value);
}

// Store auto-saves, but you can force save if needed
store.save()?;
```

**Update capabilities (default.json):**

```json
{
  "permissions": [
    // ... existing permissions ...
    "store:default"
  ]
}
```

**Frontend utility (new file):**

````typescript
// src/lib/store.ts
import { load, Store } from '@tauri-apps/plugin-store'

/**
 * App store for simple key-value persistence.
 *
 * Use this for:
 * - Recent files list
 * - UI state that should persist (collapsed panels, etc.)
 * - Feature flags
 * - Cached data
 *
 * For strongly-typed settings with validation, use the Preferences system instead.
 *
 * @example
 * ```typescript
 * import { getStore, getStoreValue, setStoreValue } from '@/lib/store';
 *
 * // Simple get/set
 * await setStoreValue('recentFiles', ['/path/to/file.txt']);
 * const files = await getStoreValue<string[]>('recentFiles', []);
 *
 * // Direct store access for advanced operations
 * const store = await getStore();
 * await store.delete('oldKey');
 * ```
 */

let storeInstance: Store | null = null

/**
 * Get the app store instance.
 * Creates/loads the store on first call, returns cached instance thereafter.
 * Store auto-saves with 100ms debounce - no need to call save() manually.
 */
export async function getStore(): Promise<Store> {
  if (!storeInstance) {
    storeInstance = await load('app-data.json', { autoSave: true })
  }
  return storeInstance
}

/**
 * Get a value from the store with a default fallback.
 */
export async function getStoreValue<T>(
  key: string,
  defaultValue: T
): Promise<T> {
  const store = await getStore()
  const value = await store.get<T>(key)
  return value ?? defaultValue
}

/**
 * Set a value in the store.
 * Auto-saves after 100ms debounce - no manual save needed.
 */
export async function setStoreValue<T>(key: string, value: T): Promise<void> {
  const store = await getStore()
  await store.set(key, value)
  // Note: Don't call save() - autoSave handles it with debouncing
}

/**
 * Delete a key from the store.
 */
export async function deleteStoreValue(key: string): Promise<void> {
  const store = await getStore()
  await store.delete(key)
}

/**
 * Check if a key exists in the store.
 */
export async function hasStoreValue(key: string): Promise<boolean> {
  const store = await getStore()
  return store.has(key)
}
````

**Files to create/modify:**

- `src-tauri/Cargo.toml`
- `src-tauri/src/lib.rs`
- `src-tauri/capabilities/default.json`
- `package.json` (npm dependency added by `tauri add`)
- `src/lib/store.ts` (new)

### Phase 4: Context Menu Utility

Create a utility for easy native context menus (built-in Tauri feature, no plugin needed).

**Frontend utility (new file):**

````typescript
// src/lib/context-menu.ts
import { Menu, MenuItem, PredefinedMenuItem } from '@tauri-apps/api/menu'

/**
 * Context menu utilities for native right-click menus.
 *
 * @example
 * ```typescript
 * // Custom context menu
 * await showContextMenu([
 *   { id: 'copy', label: 'Copy', accelerator: 'CmdOrCtrl+C', action: handleCopy },
 *   { type: 'separator' },
 *   { id: 'delete', label: 'Delete', action: handleDelete },
 * ]);
 *
 * // Standard edit menu (Cut, Copy, Paste, Select All)
 * await showEditContextMenu();
 * ```
 */

export interface ContextMenuItem {
  id: string
  label: string
  accelerator?: string
  disabled?: boolean
  action?: () => void
}

export interface ContextMenuSeparator {
  type: 'separator'
}

export type ContextMenuEntry = ContextMenuItem | ContextMenuSeparator

/**
 * Show a custom context menu at the current cursor position.
 */
export async function showContextMenu(
  items: ContextMenuEntry[]
): Promise<void> {
  const menuItems = await Promise.all(
    items.map(async item => {
      if ('type' in item && item.type === 'separator') {
        return PredefinedMenuItem.new({ item: 'Separator' })
      }
      return MenuItem.new({
        id: item.id,
        text: item.label,
        accelerator: item.accelerator,
        enabled: !item.disabled,
        action: item.action,
      })
    })
  )

  const menu = await Menu.new({ items: menuItems })
  await menu.popup()
}

/**
 * Show a standard edit context menu with Cut, Copy, Paste, Select All.
 * Uses native predefined menu items that work with the system clipboard.
 */
export async function showEditContextMenu(): Promise<void> {
  const menu = await Menu.new({
    items: [
      await PredefinedMenuItem.new({ item: 'Cut' }),
      await PredefinedMenuItem.new({ item: 'Copy' }),
      await PredefinedMenuItem.new({ item: 'Paste' }),
      await PredefinedMenuItem.new({ item: 'Separator' }),
      await PredefinedMenuItem.new({ item: 'SelectAll' }),
    ],
  })
  await menu.popup()
}

/**
 * Show a context menu for text input fields.
 * Includes Undo/Redo in addition to standard edit operations.
 */
export async function showTextInputContextMenu(): Promise<void> {
  const menu = await Menu.new({
    items: [
      await PredefinedMenuItem.new({ item: 'Undo' }),
      await PredefinedMenuItem.new({ item: 'Redo' }),
      await PredefinedMenuItem.new({ item: 'Separator' }),
      await PredefinedMenuItem.new({ item: 'Cut' }),
      await PredefinedMenuItem.new({ item: 'Copy' }),
      await PredefinedMenuItem.new({ item: 'Paste' }),
      await PredefinedMenuItem.new({ item: 'Separator' }),
      await PredefinedMenuItem.new({ item: 'SelectAll' }),
    ],
  })
  await menu.popup()
}
````

**Files to create:**

- `src/lib/context-menu.ts` (new)

### Phase 5: Tests

Add tests for the new utilities.

**Store utility tests (new file):**

```typescript
// src/lib/store.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Tauri store plugin
vi.mock('@tauri-apps/plugin-store', () => ({
  load: vi.fn(),
  Store: vi.fn(),
}))

describe('store utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should be importable', async () => {
    // Basic smoke test - actual functionality requires Tauri runtime
    const module = await import('./store')
    expect(module.getStore).toBeDefined()
    expect(module.getStoreValue).toBeDefined()
    expect(module.setStoreValue).toBeDefined()
    expect(module.deleteStoreValue).toBeDefined()
    expect(module.hasStoreValue).toBeDefined()
  })
})
```

**Context menu utility tests (new file):**

```typescript
// src/lib/context-menu.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Tauri menu API
vi.mock('@tauri-apps/api/menu', () => ({
  Menu: {
    new: vi.fn().mockResolvedValue({
      popup: vi.fn().mockResolvedValue(undefined),
    }),
  },
  MenuItem: {
    new: vi.fn().mockResolvedValue({}),
  },
  PredefinedMenuItem: {
    new: vi.fn().mockResolvedValue({}),
  },
}))

describe('context-menu utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should be importable', async () => {
    const module = await import('./context-menu')
    expect(module.showContextMenu).toBeDefined()
    expect(module.showEditContextMenu).toBeDefined()
    expect(module.showTextInputContextMenu).toBeDefined()
  })
})
```

**Files to create:**

- `src/lib/store.test.ts` (new)
- `src/lib/context-menu.test.ts` (new)

### Phase 6: Documentation

Create `docs/developer/tauri-plugins.md` documenting:

- All currently installed plugins with usage patterns
- Built-in features (context menus, system tray)
- Decision guide for choosing between storage options
- Links to official docs

**Files to create/modify:**

- `docs/developer/tauri-plugins.md` (new)
- `docs/developer/data-persistence.md` (add Store plugin section and cross-reference)

### Phase 7: Final Verification

- [ ] Run `npm run check:all` - all checks pass
- [ ] Run `npm run tauri:dev` - app starts without errors
- [ ] Test: Close app, reopen - main window restores position/size
- [ ] Test: Try to open second instance - first instance focuses
- [ ] Test: Store utility works (can save/load values)
- [ ] Test: Context menu appears on right-click
- [ ] Review all documentation for accuracy

---

## Tasks Checklist

### Phase 1: Single Instance Plugin

- [ ] Add `tauri-plugin-single-instance` to Cargo.toml (desktop only)
- [ ] Restructure lib.rs to register single-instance FIRST in builder chain
- [ ] Test: Try opening second instance, first should focus

### Phase 2: Window State Plugin

- [ ] Add `tauri-plugin-window-state` to Cargo.toml (desktop only)
- [ ] Add plugin to builder chain (after single-instance)
- [ ] Add `window-state:default` to capabilities
- [ ] Exclude quick-pane from state restoration
- [ ] Test: Close app at specific position, reopen - should restore

### Phase 3: Store Plugin

- [ ] Run `npm run tauri add store`
- [ ] Add `store:default` to capabilities
- [ ] Add StoreExt usage example in Rust (optional, for reference)
- [ ] Create `src/lib/store.ts` utility
- [ ] Test: Save and retrieve values

### Phase 4: Context Menu Utility

- [ ] Create `src/lib/context-menu.ts`
- [ ] Test: Right-click shows native menu

### Phase 5: Tests

- [ ] Create `src/lib/store.test.ts`
- [ ] Create `src/lib/context-menu.test.ts`
- [ ] Run `npm run test:run` - all tests pass

### Phase 6: Documentation

- [ ] Create `docs/developer/tauri-plugins.md`
- [ ] Update `docs/developer/data-persistence.md` with Store section
- [ ] Ensure cross-references are correct

### Phase 7: Final Verification

- [ ] Run `npm run check:all`
- [ ] Manual testing of all new functionality
- [ ] Review documentation accuracy

---

## Notes

- Single instance MUST be registered first in the plugin chain
- Window state and single instance are Rust-only (no frontend package needed)
- Store plugin requires both Rust and npm packages
- Context menu is built into `@tauri-apps/api` (no additional packages)
- All new plugins are desktop-only (use `#[cfg(desktop)]` for conditional compilation)
- Quick-pane is excluded from window state because it uses dynamic cursor-based positioning
- Store auto-saves with 100ms debounce - don't call save() manually after every operation

## References

- [Tauri v2 Official Plugins](https://v2.tauri.app/plugin/)
- [Tauri Plugins Workspace (GitHub)](https://github.com/tauri-apps/plugins-workspace)
- [Store Plugin Docs](https://v2.tauri.app/plugin/store/)
- [Window State Plugin Docs](https://v2.tauri.app/plugin/window-state/)
- [Single Instance Plugin Docs](https://v2.tauri.app/plugin/single-instance/)
- [Menu API Reference](https://v2.tauri.app/reference/javascript/api/namespacemenu/)
