# Task 7: Simple Keyboard Shortcuts

## Overview
Set up basic keyboard shortcuts using react-hotkeys-hook that integrate with the existing command system.

**KEEP IT SIMPLE** - Just the essential shortcuts with a clear pattern for adding more.

## What We Need
1. Install react-hotkeys-hook
2. Add basic macOS shortcuts in MainWindow
3. Connect shortcuts to existing command system
4. Clear documentation for adding new shortcuts

## Basic Shortcuts Needed
- `Cmd+,` → Open Preferences  
- `Cmd+K` → Toggle Command Palette
- `Cmd+1` → Toggle Left Sidebar
- `Cmd+2` → Toggle Right Sidebar

## Implementation Plan

### 1. Install react-hotkeys-hook
- Add `react-hotkeys-hook` to dependencies
- Proven to work well with Tauri apps

### 2. Create Event Listeners Hook
- Create `useMainWindowEventListeners` hook (or `useKeyboardShortcuts`)
- Contains all the keyboard shortcut logic
- Keeps MainWindow component clean
- Sets up good pattern for scaling

### 3. Connect to Command System
- Hook uses existing `CommandContext` functions
- Each shortcut calls appropriate command
- No complex registry needed - just organized in one place

### 4. Document the Pattern
- Show how to add new shortcuts to the hook
- Explain how they integrate with commands and menus

## Simple Implementation Example
```typescript
// src/hooks/useMainWindowEventListeners.ts
import { useHotkeys } from 'react-hotkeys-hook'
import { useCommandContext } from './use-command-context'

export function useMainWindowEventListeners() {
  const { openPreferences, toggleCommandPalette, toggleSidebar } = useCommandContext()

  // Keyboard shortcuts
  useHotkeys('cmd+comma', openPreferences)
  useHotkeys('cmd+k', toggleCommandPalette)  
  useHotkeys('cmd+1', () => toggleSidebar('left'))
  useHotkeys('cmd+2', () => toggleSidebar('right'))

  // Future: other global event listeners can go here
  // useHotkeys('cmd+n', createNewFile)
  // useWindowFocusListeners()
  // useMenuEventListeners()
}

// In MainWindow.tsx
function MainWindow() {
  useMainWindowEventListeners() // Clean and simple!
  
  // ... rest of component
}
```

## Files to Create/Modify
- `package.json` (add react-hotkeys-hook dependency)
- `src/hooks/useMainWindowEventListeners.ts` (new - contains all shortcuts)
- `src/components/layout/MainWindow.tsx` (import and use the hook)
- `docs/developer/architecture-guide.md` (document shortcut pattern)

## Pattern for Adding New Shortcuts
1. Add `useHotkeys('key-combo', callbackFunction)` in `useMainWindowEventListeners` hook
2. Callback should call existing command system functions
3. Update menu items to show the shortcut
4. Document the new shortcut

## Scaling Benefits
- MainWindow stays clean even with hundreds of shortcuts
- All global event listeners in one organized place
- Easy to find and modify shortcuts
- Good separation of concerns

## Acceptance Criteria
- [ ] react-hotkeys-hook installed and working
- [ ] Cmd+, opens preferences
- [ ] Cmd+K toggles command palette  
- [ ] Cmd+1/2 toggle sidebars
- [ ] Shortcuts work alongside Tauri native menus
- [ ] Clear documentation for adding new shortcuts
- [ ] Input fields don't trigger global shortcuts (react-hotkeys-hook handles this)