# Tauri Plugins Enhancement

## Overview

Add commonly-needed Tauri v2 plugins with idiomatic patterns and comprehensive documentation. This task includes creating a developer guide for all plugins (existing and new).

## Research Summary

### Current Plugins (Already Installed)

| Plugin | Purpose | Status |
|--------|---------|--------|
| opener | Open files/URLs with system default apps | ✅ Working |
| clipboard-manager | Clipboard read/write | ✅ Working |
| dialog | Native open/save/message dialogs | ✅ Working |
| fs | File system access | ✅ Working |
| log | Configurable logging | ✅ Working |
| notification | System notifications | ✅ Working |
| persisted-scope | Persistent file access permissions | ✅ Working |
| process | Exit/restart app | ✅ Working |
| os | OS info | ✅ Working |
| global-shortcut | System-wide keyboard shortcuts | ✅ Working |
| updater | In-app updates (desktop) | ✅ Working |
| tauri-nspanel | macOS native panels (custom) | ✅ Working |

### Plugins to Add

| Plugin | Priority | Rationale |
|--------|----------|-----------|
| **window-state** | Essential | Users expect windows to reopen where they left them |
| **single-instance** | Essential | Prevent multiple app instances - standard desktop UX |
| **store** | High | Simple key-value storage for ad-hoc data (complements existing preferences) |

### Built-in Features (No Plugin Needed)

- **Context menus**: Menu API has `popup()` method in Tauri v2
- **System tray**: Built into Tauri v2 via `tray-icon` feature

### Plugins NOT Adding (Documented Only)

| Plugin | When to Add |
|--------|-------------|
| shell | Apps needing to spawn child processes |
| http | API calls bypassing CORS |
| autostart | Utility apps that launch at startup |
| deep-link | Custom URL schemes (myapp://) |
| sql | Local SQLite database |
| positioner | Tray apps, floating windows |

## Architecture Decision: Store Plugin vs Custom Preferences

**Decision: Keep both, use for different purposes**

### Current Preferences System (Keep)
- **Purpose**: Strongly-typed app settings
- **Why keep**: Already well-implemented with atomic writes, type-safe via tauri-specta, integrated with TanStack Query, supports Rust-side validation
- **Use for**: Theme, keyboard shortcuts, any setting that benefits from type safety

### Store Plugin (Add)
- **Purpose**: Simple key-value storage for ad-hoc data
- **Why add**: Less boilerplate for simple data, lazy loading, auto-save, battle-tested official solution
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

### Phase 1: Documentation Foundation

Create `docs/developer/tauri-plugins.md` documenting:
- All currently installed plugins with usage patterns
- Built-in features (context menus, system tray)
- Decision guide for choosing between storage options
- Links to official docs

**Files to create/modify:**
- `docs/developer/tauri-plugins.md` (new)
- `docs/developer/data-persistence.md` (update to reference new doc)

### Phase 2: Window State Plugin

Automatically save/restore window position and size.

**Installation:**
```bash
cargo add tauri-plugin-window-state --target 'cfg(any(target_os = "macos", windows, target_os = "linux"))'
```

**Rust setup (lib.rs):**
```rust
#[cfg(desktop)]
app.handle().plugin(tauri_plugin_window_state::Builder::default().build())?;
```

**Files to modify:**
- `src-tauri/Cargo.toml`
- `src-tauri/src/lib.rs`

**No frontend changes needed** - works automatically.

### Phase 3: Single Instance Plugin

Prevent multiple app instances, focus existing window instead.

**Installation:**
```bash
cargo add tauri-plugin-single-instance --target 'cfg(any(target_os = "macos", windows, target_os = "linux"))'
```

**Rust setup (lib.rs):**
```rust
// Register FIRST, before other plugins
#[cfg(desktop)]
app.handle().plugin(tauri_plugin_single_instance::init(|app, _args, _cwd| {
    // Focus existing window when user tries to open second instance
    if let Some(window) = app.get_webview_window("main") {
        let _ = window.set_focus();
        let _ = window.unminimize();
    }
}))?;
```

**Files to modify:**
- `src-tauri/Cargo.toml`
- `src-tauri/src/lib.rs`

**No frontend changes needed** - Rust-only plugin.

### Phase 4: Store Plugin

Add simple key-value storage for ad-hoc data.

**Installation:**
```bash
npm run tauri add store
```

**Frontend utility (new file):**
```typescript
// src/lib/store.ts
import { load, LazyStore } from '@tauri-apps/plugin-store';

// Lazy-loaded store for simple key-value data
// Use this for data that doesn't need strong typing or validation
export const appStore = new LazyStore('app-store.json');

// Helper functions
export async function getStoreValue<T>(key: string, defaultValue: T): Promise<T> {
  const value = await appStore.get<T>(key);
  return value ?? defaultValue;
}

export async function setStoreValue<T>(key: string, value: T): Promise<void> {
  await appStore.set(key, value);
  await appStore.save();
}
```

**Files to create/modify:**
- `src-tauri/Cargo.toml`
- `src-tauri/src/lib.rs`
- `src-tauri/capabilities/default.json`
- `package.json` (npm dependency)
- `src/lib/store.ts` (new)

### Phase 5: Context Menu Utility

Create a utility for easy native context menus (built-in, no plugin).

**Frontend utility (new file):**
```typescript
// src/lib/context-menu.ts
import { Menu, MenuItem, PredefinedMenuItem, Submenu } from '@tauri-apps/api/menu';

export interface ContextMenuItem {
  id: string;
  label: string;
  accelerator?: string;
  disabled?: boolean;
  action?: () => void;
}

export interface ContextMenuSeparator {
  type: 'separator';
}

export type ContextMenuEntry = ContextMenuItem | ContextMenuSeparator;

export async function showContextMenu(items: ContextMenuEntry[]): Promise<void> {
  const menuItems = await Promise.all(
    items.map(async (item) => {
      if ('type' in item && item.type === 'separator') {
        return { type: 'Separator' as const };
      }
      return MenuItem.new({
        id: item.id,
        text: item.label,
        accelerator: item.accelerator,
        enabled: !item.disabled,
        action: item.action,
      });
    })
  );

  const menu = await Menu.new({ items: menuItems });
  await menu.popup();
}

// Predefined menu for text editing
export async function showEditContextMenu(): Promise<void> {
  const menu = await Menu.new({
    items: [
      await PredefinedMenuItem.new({ item: 'Cut' }),
      await PredefinedMenuItem.new({ item: 'Copy' }),
      await PredefinedMenuItem.new({ item: 'Paste' }),
      { type: 'Separator' },
      await PredefinedMenuItem.new({ item: 'SelectAll' }),
    ],
  });
  await menu.popup();
}
```

**Files to create:**
- `src/lib/context-menu.ts` (new)

### Phase 6: Update Documentation

Update all related documentation:
- `docs/developer/tauri-plugins.md` - Complete with all patterns
- `docs/developer/data-persistence.md` - Add Store plugin section
- `CLAUDE.md` - Update if needed
- `README.md` - Mention key plugins

---

## Tasks Checklist

### Phase 1: Documentation Foundation
- [ ] Create `docs/developer/tauri-plugins.md`
- [ ] Document all existing plugins
- [ ] Document built-in features (context menus, tray)
- [ ] Add decision guide for storage options
- [ ] Update `docs/developer/data-persistence.md` cross-references

### Phase 2: Window State Plugin
- [ ] Add to Cargo.toml
- [ ] Initialize in lib.rs (desktop only)
- [ ] Test window position restore
- [ ] Document in tauri-plugins.md

### Phase 3: Single Instance Plugin
- [ ] Add to Cargo.toml
- [ ] Initialize in lib.rs (FIRST, before other plugins)
- [ ] Test second instance focusing
- [ ] Document in tauri-plugins.md

### Phase 4: Store Plugin
- [ ] Add Rust dependency
- [ ] Add npm dependency
- [ ] Update capabilities
- [ ] Create `src/lib/store.ts` utility
- [ ] Add usage examples
- [ ] Document in tauri-plugins.md

### Phase 5: Context Menu Utility
- [ ] Create `src/lib/context-menu.ts`
- [ ] Add edit context menu helper
- [ ] Add example usage in a component
- [ ] Document in tauri-plugins.md

### Phase 6: Final Documentation
- [ ] Review and polish all docs
- [ ] Ensure cross-references are correct
- [ ] Run `npm run check:all`

---

## Notes

- Window state and single instance are Rust-only (no frontend package needed)
- Store plugin requires both Rust and npm packages
- Context menu is built into `@tauri-apps/api` (no additional packages)
- Single instance must be registered FIRST before other plugins
- All plugins are desktop-only (conditional compilation with `#[cfg(desktop)]`)

## References

- [Tauri v2 Official Plugins](https://v2.tauri.app/plugin/)
- [Tauri Plugins Workspace (GitHub)](https://github.com/tauri-apps/plugins-workspace)
- [Store Plugin Docs](https://v2.tauri.app/plugin/store/)
- [Window State Plugin Docs](https://v2.tauri.app/plugin/window-state/)
- [Single Instance Plugin Docs](https://v2.tauri.app/plugin/single-instance/)
- [Menu API Reference](https://v2.tauri.app/reference/javascript/api/namespacemenu/)
