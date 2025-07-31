# Task 4: Command Palette UI

## Overview
Build the actual command palette UI using Shadcn's Command component, connecting it to the existing command registry system.

**KEEP IT SIMPLE** - Just get the UI working with basic commands and good UX.

## What We Need
1. Working CommandPalette component using Shadcn's Command
2. Cmd+K to open/close the palette
3. Fuzzy search that works well
4. Basic commands: Open Preferences, Toggle Left Sidebar, Toggle Right Sidebar
5. Clear documentation for adding new commands

## Current State
- Command registry system already exists and works well
- CommandPalette is just a placeholder
- Need to build the actual UI and wire it up

## Implementation Plan

### 1. Build CommandPalette Component
- Use Shadcn's `Command` component (already installed as `cmdk`)
- Modal dialog that opens with Cmd+K
- Search input with fuzzy matching
- Command list with keyboard navigation
- Execute commands on selection

### 2. Add Basic Commands
- "Open Preferences" → calls context.openPreferences()
- "Toggle Left Sidebar" → calls context.toggleSidebar()  
- "Toggle Right Sidebar" → calls context.toggleSidebar()
- Register these in existing command files

### 3. Wire Up Keyboard Shortcut
- Add Cmd+K handler to open palette
- Integrate with existing command context hook
- Close on escape or selection

### 4. Polish UX
- Proper theming to match app
- Good keyboard navigation
- Smooth animations
- Proper focus management

## Files to Create/Modify
- `src/components/command-palette/CommandPalette.tsx` (implement the UI)
- `src/lib/commands/navigation-commands.ts` (add sidebar commands)
- `src/hooks/use-command-context.ts` (add palette toggle)
- `src/components/layout/MainWindow.tsx` (add Cmd+K handler)
- `docs/developer/architecture-guide.md` (document how to add commands)

## Command Examples
```typescript
// Simple commands to add:
{
  id: 'open-preferences',
  label: 'Open Preferences',
  description: 'Open the app preferences dialog',
  execute: (context) => context.openPreferences()
}

{
  id: 'toggle-left-sidebar', 
  label: 'Toggle Left Sidebar',
  description: 'Show or hide the left sidebar',
  execute: (context) => context.toggleSidebar()
}
```

## Acceptance Criteria
- [ ] Cmd+K opens command palette
- [ ] Fuzzy search works smoothly
- [ ] Basic commands execute correctly
- [ ] Keyboard navigation feels good
- [ ] Proper theming and animations
- [ ] Clear docs for adding new commands
- [ ] Escape/selection closes palette
- [ ] No performance issues with search