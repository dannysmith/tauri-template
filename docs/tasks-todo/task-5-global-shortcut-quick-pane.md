# Global Shortcut and Quick Pane System

## Overview

Add a globally-accessible quick entry panel - a small floating window triggered via global keyboard shortcut even when the main application is not focused. This demonstrates a common pattern for quick entry, command palettes, and similar quick-access features.

---

## Requirements

### Functional Requirements

1. **Quick Pane Window**
   - Small floating window that appears above other applications (including fullscreen apps on macOS)
   - Does not appear in taskbar/dock
   - Contains a single text input field ("New text")
   - Appears centered on the monitor containing the mouse cursor

2. **Global Keyboard Shortcut**
   - Default: `Cmd+Shift+.` (macOS) / `Ctrl+Shift+.` (Windows/Linux)
   - User-configurable via settings UI (click input, press desired combination)
   - Persisted to preferences

3. **Focus & Dismiss Behavior**
   - Quick pane gains focus when opened
   - Escape key dismisses the pane
   - Dismiss on focus loss (covers click-outside on all platforms)
   - macOS: Native NSPanel behavior for proper fullscreen app overlay

4. **State Demonstration**
   - Text entered in quick pane updates main window content
   - Main window center area displays "Last entry: {text}" instead of "Hello World"
   - Demonstrates cross-window state synchronization pattern

### Non-Functional Requirements

- Cross-platform: macOS (primary), Windows, Linux X11
- Linux Wayland: Not supported (document limitation)
- Extensible pattern - users can replace text input with any action (Zustand update, TanStack mutation, API call, etc.)

---

## Technical Approach

### Window Strategy

**All Platforms:** Create standard Tauri window with:

- `always_on_top: true`
- `skip_taskbar: true`
- `decorations: false`
- `visible: false` (start hidden)

**macOS Enhancement:** Convert to NSPanel using `tauri-nspanel` for:

- Proper overlay on fullscreen apps
- Native panel focus behavior
- Click-outside-to-dismiss (native)

**Note:** Previous window reactivation on dismiss requires additional work - NSPanel doesn't do this automatically. We'll need to track the previously active app and reactivate it, or accept this as a v2 enhancement.

### Multi-Window Architecture

**Idiomatic Tauri + Vite multi-window setup:**

1. **Separate HTML entry points:** `index.html` (main) + `quick-pane.html` (pane)
2. **Vite rollupOptions.input:** Configure both HTML files so they're built to `dist/`
3. **tauri.conf.json:** Define main window only
4. **Dynamic window creation:** Create quick pane via `WebviewWindowBuilder::new(..., WebviewUrl::App("quick-pane.html".into()))`

Each HTML file has its own React root - windows are completely separate JavaScript contexts.

### Global Shortcut

Use `tauri-plugin-global-shortcut` (official plugin). Register shortcut on app startup, re-register when user changes it in settings.

**Error handling:** If registration fails (shortcut already taken by another app), show error toast immediately and keep previous shortcut.

### Cross-Window Communication

Use Tauri events for flexibility:

1. Quick pane submits text via `emit('quick-pane-submit', { text })`
2. Main window listens with `listen('quick-pane-submit', handler)`
3. Handler can do anything: update Zustand, call TanStack mutation, invoke Tauri command, etc.

This pattern doesn't constrain the action type - the template demonstrates Zustand update, but users can wire it to anything.

---

## Implementation Plan

### Phase 1: Multi-Window Setup

**Goal:** Establish the multi-window architecture with a visible quick pane.

**Tasks:**

- [ ] Create `quick-pane.html` in project root (alongside `index.html`)
- [ ] Create `src/quick-pane-main.tsx` - React entry point for quick pane
- [ ] Create `src/components/quick-pane/QuickPaneApp.tsx` - the pane UI
  - Single text input with placeholder "Enter text..."
  - Submit on Enter key
  - Style to match app theme (dark/light)
  - Include ThemeProvider for consistent styling
- [ ] Update `vite.config.ts` with rollupOptions.input for both HTML files:
  ```typescript
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'quick-pane': resolve(__dirname, 'quick-pane.html'),
      },
    },
  }
  ```
- [ ] Create Rust command to create/show/hide quick pane window:
  ```rust
  WebviewWindowBuilder::new(&app, "quick-pane", WebviewUrl::App("quick-pane.html".into()))
      .title("Quick Entry")
      .inner_size(400.0, 80.0)
      .always_on_top(true)
      .skip_taskbar(true)
      .decorations(false)
      .visible(false)
      .build()?;
  ```
- [ ] Add capability permissions for window creation
- [ ] Test: Can create and show quick pane window, styled correctly

**Testable State:** Quick pane window can be shown via Rust command, displays input field, styled correctly.

---

### Phase 2: Cross-Window Communication

**Goal:** Text submitted in quick pane updates main window.

**Tasks:**

- [ ] Define Tauri event: `quick-pane-submit` with payload `{ text: string }`
- [ ] Quick pane: emit event on form submit, then hide window
- [ ] Add `lastQuickPaneEntry: string | null` to existing `ui-store.ts`
- [ ] Main window: listen for `quick-pane-submit` event in `useMainWindowEventListeners.ts`, update store
- [ ] Update `MainWindowContent.tsx` to display last entry from store
- [ ] Test: Submit text in quick pane, main window updates to show it

**Testable State:** Full round-trip working - submit in pane, see update in main window.

---

### Phase 3: Global Shortcut

**Goal:** Toggle quick pane with global keyboard shortcut.

**Tasks:**

- [ ] Add `tauri-plugin-global-shortcut` dependency
- [ ] Configure permissions in capabilities
- [ ] Register default shortcut (`CommandOrControl+Shift+Period`) on app startup
- [ ] Shortcut handler: toggle quick pane visibility
- [ ] Handle focus: when showing, focus the input field
- [ ] Handle dismiss: Escape key hides pane
- [ ] Handle dismiss: Focus loss (blur event) hides pane
- [ ] **Error handling:** If shortcut registration fails, show error toast with message
- [ ] Test: App in background, press shortcut, pane appears, Escape/blur dismisses

**Testable State:** Global shortcut works from any app, pane shows/hides correctly, registration errors shown to user.

---

### Phase 4: macOS NSPanel Enhancement

**Goal:** Native panel behavior on macOS for fullscreen app overlay.

**Tasks:**

- [ ] Add `tauri-nspanel` dependency (macOS only via cfg)
- [ ] After creating quick pane window, convert to NSPanel on macOS
- [ ] Configure panel level for proper floating behavior (above fullscreen apps)
- [ ] Ensure conversion happens before window is ever shown (initialization sequencing)
- [ ] Test click-outside-to-dismiss behavior (should work natively with NSPanel)
- [ ] Test: On macOS fullscreen app, shortcut shows pane overlaid correctly

**Note:** Previous-window-reactivation is deferred - would require tracking active app before showing and reactivating on dismiss. Can add in future iteration if needed.

**Testable State:** macOS users get native panel UX, pane overlays fullscreen apps correctly.

---

### Phase 5: Configurable Shortcut

**Goal:** Users can customize the global shortcut in settings.

**Tasks:**

- [ ] Add `quickPaneShortcut: string` field to `AppPreferences` type (Rust + TS)
- [ ] Create `ShortcutPicker` component for settings:
  - Displays current shortcut (formatted nicely)
  - Click to enter capture mode ("Press shortcut...")
  - Press key combination to set
  - Escape to cancel capture
  - On capture: attempt to register, show error if fails, revert to previous
- [ ] Add shortcut setting to Preferences dialog
- [ ] On preference change: unregister old shortcut, register new one
- [ ] On app startup: load saved shortcut (or use default if not set/invalid)
- [ ] Test: Change shortcut in settings, new shortcut works immediately

**Testable State:** Full feature complete - configurable shortcut persisted and working.

---

### Phase 6: Polish & Documentation

**Goal:** Production-ready with documentation.

**Tasks:**

- [ ] Position quick pane on monitor with mouse cursor (use `cursor_position()` API)
- [ ] Clear input field after successful submit
- [ ] Add developer documentation to `docs/developer/quick-pane.md`:
  - How to customize pane content
  - How to wire to different actions (Zustand, TanStack, API)
  - Multi-window architecture explanation
  - Platform-specific notes
- [ ] Update `docs/developer/architecture-guide.md` with cross-window patterns
- [ ] Add note about Wayland limitations
- [ ] Test on Windows and Linux X11 if possible

**Testable State:** Feature complete, documented, ready for template users.

---

## Technical Context

### Key Dependencies

```toml
# Cargo.toml additions
tauri-plugin-global-shortcut = "2"

# macOS only
[target.'cfg(target_os = "macos")'.dependencies]
tauri-nspanel = { git = "https://github.com/ahkohd/tauri-nspanel", branch = "v2.1" }
```

### Vite Configuration

```typescript
// vite.config.ts
import { resolve } from 'path'

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'quick-pane': resolve(__dirname, 'quick-pane.html'),
      },
    },
  },
  // ... existing config
})
```

### Quick Pane HTML Entry Point

```html
<!-- quick-pane.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Quick Entry</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/quick-pane-main.tsx"></script>
  </body>
</html>
```

### Event Schema

```typescript
// Quick pane → Main window (and any other listeners)
type QuickPaneSubmitEvent = {
  text: string
}

// For extensibility, users might change this to:
type QuickPaneSubmitEvent = {
  action: 'create-task' | 'quick-note' | 'search'
  payload: unknown
}
```

### Platform Behavior Summary

| Platform      | Global Shortcut   | Panel Behavior                       | Dismiss                       |
| ------------- | ----------------- | ------------------------------------ | ----------------------------- |
| macOS         | Full support      | Native NSPanel (overlays fullscreen) | Click-outside + Escape + blur |
| Windows       | Full support      | Always-on-top window                 | Escape + blur                 |
| Linux X11     | Full support      | Always-on-top window                 | Escape + blur                 |
| Linux Wayland | **Not supported** | -                                    | -                             |

### Resources

- [tauri-nspanel](https://github.com/ahkohd/tauri-nspanel) - NSPanel for macOS
- [tauri-plugin-global-shortcut](https://v2.tauri.app/plugin/global-shortcut/) - Official docs
- [Vite Multi-Page Apps](https://vite.dev/guide/build#multi-page-app) - rollupOptions.input docs
- [Tauri multi-window tutorial](https://tauritutorials.com/blog/creating-windows-in-tauri) - WebviewWindowBuilder usage
- [Cross-window Zustand sync pattern](https://www.gethopp.app/blog/tauri-window-state-sync) - Reference for more complex sync

---

## Notes

- Each Tauri window runs a separate React instance - they cannot share JavaScript context
- The event-based pattern is intentionally flexible - template demonstrates Zustand but users can wire to any action
- macOS is the primary target since Spotlight-like UX is most common there
- NSPanel is required for proper fullscreen app overlay on macOS - always-on-top alone won't work
- Previous-window-reactivation (returning focus to the app user was in before opening pane) is a nice-to-have for future iteration
