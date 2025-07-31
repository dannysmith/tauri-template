# Task 8: Simple Native Menu System

## Overview

Add essential native macOS menu items for the features we actually have, working with Tauri's default menu structure.

**KEEP IT SIMPLE** - Only add menus for functionality that exists in the template.

## What We Need

1. Check what default menus Tauri already provides
2. Add essential menu items for existing features:
   - About dialog
   - Check for Updates (auto-updater)
   - Preferences (Cmd+,)
   - Toggle sidebars (Cmd+1, Cmd+2)
3. Connect menu items to existing command system
4. Show keyboard shortcuts in menu items

## Essential Menu Items Only

```
[App Name] (use existing Tauri defaults where possible)
├── About [App Name]           → Simple about dialog
├── ─────────────────
├── Check for Updates...       → Call auto-updater
├── ─────────────────
├── Preferences...    (Cmd+,)  → Open preferences dialog
├── ─────────────────
└── [Keep Tauri defaults: Hide, Quit, etc.]

View (only add if not already there)
├── Toggle Left Sidebar   (Cmd+1)  → Call command
├── Toggle Right Sidebar  (Cmd+2)  → Call command
└── [Keep existing fullscreen if Tauri provides it]

Window (keep Tauri defaults)
├── [Tauri defaults: Minimize, Close, etc.]
```

## Implementation Plan

### 1. Check Default Tauri Menus

- Run app and see what menus Tauri provides by default
- Keep everything that makes sense (Hide, Quit, Minimize, etc.)
- Only add what's missing for our features

### 2. Add Essential Menu Items (Rust)

- Add menu setup in `src-tauri/src/lib.rs`
- Create simple menu with only needed items
- Connect to existing command system via events

### 3. Simple Menu Event Handling

- Handle menu clicks in Rust
- Emit events to React for command execution
- Use existing command context functions

### 4. Connect to Existing Systems

- Menu items call same functions as keyboard shortcuts
- Use existing CommandContext for consistency
- Show keyboard shortcuts in menu items

## Files to Create/Modify

- `src-tauri/src/lib.rs` (add menu setup to existing run() function)
- `src/hooks/useMainWindowEventListeners.ts` (add menu event listener)
- `docs/developer/architecture-guide.md` (document menu pattern)

## Simple Menu Event Flow

1. **Menu click** → Rust menu handler
2. **Emit event** → React event listener
3. **Call command** → Existing command context functions

## Pattern for Adding Menu Items

1. Add menu item in Rust menu setup
2. Add event listener in `useMainWindowEventListeners`
3. Call existing command function
4. Document the new menu item

## Context Menus (Bonus)

Since Tauri v2 has built-in context menu support, we should also document the pattern for right-click context menus.

### Context Menu Pattern

```typescript
// In React component
const handleContextMenu = (e: React.MouseEvent) => {
  e.preventDefault()
  // Use Tauri v2's built-in context menu API
  // Show context menu with relevant commands for this component
  // Call same command system functions as other menus
}
```

### Context Menu Integration

- **Same commands** - Context menus call the same command functions
- **Context-aware** - Show relevant options based on what was right-clicked
- **Consistent pattern** - Use existing CommandContext functions

### Documentation Needed

- How to create context menus with Tauri v2 built-in API
- Pattern for integrating with existing command system
- Examples for different UI components (sidebar items, main content, etc.)

## Acceptance Criteria

- [ ] Essential menu items added (About, Check Updates, Preferences, Sidebar toggles)
- [ ] Menu items call existing command system functions
- [ ] Keyboard shortcuts shown in menu items
- [ ] Menu works alongside keyboard shortcuts
- [ ] Simple about dialog implemented
- [ ] Clear documentation for adding new menu items
- [ ] No unnecessary menus (File, Edit, etc.) for features that don't exist
- [ ] Context menu patterns documented (using Tauri v2 built-in support)
- [ ] Context menu integration with command system documented
