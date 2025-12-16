# Global Shortcut and Quick Pane System

## Session Notes

**Phases 1-4 completed.** Remaining: Phase 5 (Configurable Shortcut), Phase 6 (Polish & Docs).

**Current state:** Quick pane fully functional - appears over fullscreen apps, accepts keyboard input, dismisses correctly without space-switching, returns focus to previous app. Visual styling is basic (semi-transparent CSS, no native frosted glass blur due to window-vibrancy conflict with tauri-nspanel).

**Code review needed:** Phase 4 required adding objc2 dependencies and manual previous-app tracking via NSWorkspace/NSRunningApplication. This feels like overkill - Handy's implementation didn't need this. Investigate whether there's a simpler tauri-nspanel configuration that avoids the space-switching issue without manual app tracking.

### Implementation Notes

- **Shortcut handler gotcha:** When matching shortcuts in the handler, watch operator precedence. The condition must be `Pressed && (matchA || matchB)` not `Pressed && matchA || matchB` - the latter fires on both press AND release for the second match.
- **Theme sync between windows:** Quick pane is a separate JS context, so it can't share React state. We emit a `theme-changed` Tauri event from ThemeProvider when theme changes, and quick pane listens for it. This prevents flash of wrong theme when re-showing the window.
- **Window reuse pattern:** Quick pane window is created once, then shown/hidden. Much faster than recreating each time. Theme is re-synced on focus gain.
- **Styling:** Used transparent window + CSS `backdrop-blur-xl` + `bg-white/90` / `bg-zinc-900/90` for frosted glass effect that respects theme. Window is 500x72.
- **Test button:** Left a temporary "Show Quick Pane (Test)" button in MainWindowContent.tsx - remove after Phase 6.

---

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

### Phase 1: Multi-Window Setup ✓

**Goal:** Establish the multi-window architecture with a visible quick pane.

**Tasks:**

- [x] Create `quick-pane.html` in project root (alongside `index.html`)
- [x] Create `src/quick-pane-main.tsx` - React entry point for quick pane
- [x] Create `src/components/quick-pane/QuickPaneApp.tsx` - the pane UI
  - Single text input with placeholder "Enter text..."
  - Submit on Enter key
  - Style to match app theme (dark/light)
  - ~~Include ThemeProvider for consistent styling~~ (used simpler `applyTheme()` function + event listener)
- [x] Update `vite.config.ts` with rollupOptions.input for both HTML files
- [x] Create Rust commands: `show_quick_pane`, `hide_quick_pane`, `toggle_quick_pane`
- [x] Add capability permissions for window creation (`capabilities/quick-pane.json`)
- [x] Test: Can create and show quick pane window, styled correctly

**Testable State:** Quick pane window can be shown via Rust command, displays input field, styled correctly.

---

### Phase 2: Cross-Window Communication ✓

**Goal:** Text submitted in quick pane updates main window.

**Tasks:**

- [x] Define Tauri event: `quick-pane-submit` with payload `{ text: string }`
- [x] Quick pane: emit event on form submit, then hide window
- [x] Add `lastQuickPaneEntry: string | null` to existing `ui-store.ts`
- [x] Main window: listen for `quick-pane-submit` event in `useMainWindowEventListeners.ts`, update store
- [x] Update `MainWindowContent.tsx` to display last entry from store
- [x] Test: Submit text in quick pane, main window updates to show it

**Testable State:** Full round-trip working - submit in pane, see update in main window.

---

### Phase 3: Global Shortcut ✓

**Goal:** Toggle quick pane with global keyboard shortcut.

**Tasks:**

- [x] Add `tauri-plugin-global-shortcut` dependency
- [x] Configure permissions in capabilities
- [x] Register default shortcut (`CommandOrControl+Shift+Period`) on app startup
- [x] Shortcut handler: toggle quick pane visibility
- [x] Handle focus: when showing, focus the input field
- [x] Handle dismiss: Escape key hides pane
- [x] Handle dismiss: Focus loss (blur event) hides pane
- [ ] **Error handling:** If shortcut registration fails, show error toast with message (deferred - not yet implemented)
- [x] Test: App in background, press shortcut, pane appears, Escape/blur dismisses

**Testable State:** Global shortcut works from any app, pane shows/hides correctly.

---

### Phase 4: macOS NSPanel Enhancement (Complete)

**Goal:** Native panel behavior on macOS for fullscreen app overlay.

**Tasks:**

- [x] Add `tauri-nspanel` dependency (macOS only via cfg)
- [x] Create quick pane as NSPanel using `PanelBuilder`
- [x] Configure panel level for proper floating behavior (above fullscreen apps)
- [x] Panel creation on main thread (critical - see learnings below)
- [x] Fullscreen overlay working (panel visible over fullscreen apps)
- [x] Fix space-switching on submit/dismiss (see solution below)
- [x] Fix Escape key "boop" sound (added `e.preventDefault()`)
- [x] Click-outside-to-dismiss working (blur handler)

**Current Implementation:**

```rust
// Panel class config
tauri_panel! {
    panel!(QuickPanePanel {
        config: {
            can_become_key_window: true,  // Allows keyboard input
            can_become_main_window: false,
            is_floating_panel: true
        }
    })
}

// PanelBuilder config
PanelBuilder::<_, QuickPanePanel>::new(app, QUICK_PANE_LABEL)
    .level(PanelLevel::Status)  // High z-order for fullscreen overlay
    .collection_behavior(
        CollectionBehavior::new()
            .full_screen_auxiliary()
            .can_join_all_spaces(),
    )
    .style_mask(StyleMask::empty().nonactivating_panel())  // Required for fullscreen
    .hides_on_deactivate(false)
    .works_when_modal(true)
    // ... other config
```

**Critical Learnings:**

1. **Threading: NSPanel creation MUST happen on main thread**
   - Calling `PanelBuilder::build()` from `tauri::async_runtime::spawn` causes silent crashes
   - The async runtime uses tokio thread pool, not main thread
   - **Solution:** Create panel during `.setup()` closure (runs on main thread), keep hidden, then show/hide via commands
   - Reference: Handy PR #361 uses same pattern - creates overlay at startup, hidden

2. **Plugin initialization pattern:**

   ```rust
   let mut app_builder = tauri::Builder::default().plugin(...);

   #[cfg(target_os = "macos")]
   {
       app_builder = app_builder.plugin(tauri_nspanel::init());
   }

   app_builder.plugin(...).setup(...)...
   ```

3. **StyleMask::nonactivating_panel() is required for fullscreen overlay**
   - Without it, panel is invisible over fullscreen apps (though it still receives input)
   - The tauri-nspanel docs explicitly state this is "required for fullscreen display"

4. **PanelLevel::Status vs PanelLevel::Floating**
   - `Status` is higher z-order, better for fullscreen overlay
   - `Floating` may not be high enough for all fullscreen scenarios

5. **Regular Tauri window methods work after PanelBuilder creates panel**
   - `app.get_webview_window(label)` still works
   - `window.show()`, `window.hide()`, `window.set_focus()` work
   - No need to convert back to panel for show/hide operations

6. **Tauri commands: sync vs async determines thread**
   - `async fn` commands run on tokio thread pool (NOT main thread)
   - `fn` (sync) commands run on main thread
   - Any Cocoa/AppKit API calls MUST be on main thread or they crash
   - Made `show_quick_pane`, `dismiss_quick_pane`, `toggle_quick_pane` all sync

7. **Space-switching fix: Track and reactivate previous app**
   - **Root cause:** When hiding the panel while it has focus, macOS activates the next window in the app (our main window), causing space switch
   - **Why blur worked but Enter/Escape didn't:** Blur = focus already transferred elsewhere before hide. Enter/Escape = panel still has focus when we hide.
   - **Solution:** Added objc2 dependencies to manually track and reactivate the previous app:
     - `objc2`, `objc2-app-kit`, `objc2-foundation` in Cargo.toml (macOS only)
     - Static `PREVIOUS_APP_PID: AtomicI32` to store the previous app's process ID
     - On show: Capture frontmost app via `NSWorkspace.sharedWorkspace().frontmostApplication()`
     - On dismiss: Reactivate via `NSRunningApplication.runningApplicationWithProcessIdentifier(pid).activateWithOptions()`
   - **Note:** This feels like it shouldn't be necessary if tauri-nspanel was configured correctly. Handy didn't need this. Worth investigating if there's a simpler solution.

8. **Escape key "boop" sound fix**
   - Add `e.preventDefault()` in the keydown handler before calling dismiss
   - Without it, the Escape event propagates to the system which plays alert sound

9. **window-vibrancy conflicts with tauri-nspanel**
   - Both try to create `NSVisualEffectViewTagged` class, causing crash
   - Cannot use window-vibrancy for frosted glass effect with tauri-nspanel
   - Current visual: Semi-transparent CSS background, but no true desktop blur

**Dependencies Added This Session:**

```toml
# macOS-only in Cargo.toml
objc2 = "0.6"
objc2-app-kit = { version = "0.3", features = ["NSRunningApplication", "NSWorkspace"] }
objc2-foundation = "0.3"
```

**Key Code Additions:**

1. `PREVIOUS_APP_PID` static for tracking previous app
2. `show_quick_pane` - captures frontmost app before showing (sync, not async)
3. `dismiss_quick_pane` - hides panel then reactivates previous app (sync, not async)
4. `toggle_quick_pane` - does both capture and reactivate appropriately (sync, not async)
5. Global shortcut handler calls `toggle_quick_pane` directly (not via async spawn)

**Questions for Review:**

1. Why did Handy not need the previous-app-tracking code? Is there a panel config we're missing?
2. Is there a way to use tauri-nspanel's Panel methods directly for dismiss that doesn't cause space switch?
3. The `nonactivating_panel()` style mask should prevent app activation - why isn't it working on dismiss?

**Reference Implementation:** https://github.com/cjpais/Handy/pull/361

**Testable State:** Panel appears over fullscreen apps, keyboard works, dismiss returns to previous app correctly, no boop sound on Escape. Visual styling is basic (no frosted glass blur).

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
- [ ] Add developer documentation to `docs/developer/quick-panes.md`:
  - How to customize pane content
  - How to wire to different actions (Zustand, TanStack, API)
  - Multi-window architecture explanation
  - Platform-specific notes
- [ ] Update `docs/developer/architecture-guide.md` with cross-window patterns

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
