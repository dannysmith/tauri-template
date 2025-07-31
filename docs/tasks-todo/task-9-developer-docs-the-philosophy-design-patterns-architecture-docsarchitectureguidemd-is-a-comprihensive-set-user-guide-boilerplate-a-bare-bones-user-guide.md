# Task 9: Documentation Framework

## Overview
Create both user-facing and developer documentation that establishes clear patterns and makes it easy to maintain documentation as the template grows.

## Subtask 1: Bare-Bones User Guide

Create a minimal user guide in `docs/userguide/` that serves as a starting point and reminder to update documentation.

### What We Need
- `docs/userguide/userguide.md` with basic structure
- List of current keyboard shortcuts
- Empty sections for future features (marked as "Coming Soon")
- How to use command palette and preferences

### Structure
```
# App User Guide

## Getting Started
- Basic overview (placeholder for specific app)

## Keyboard Shortcuts
- Cmd+K: Open Command Palette
- Cmd+,: Open Preferences  
- Cmd+1: Toggle Left Sidebar
- Cmd+2: Toggle Right Sidebar

## Features
### Command Palette
How to use Cmd+K to find and run commands

### Preferences
How to customize app settings

### [Future Features]
- File Management (Coming Soon)
- Advanced Features (Coming Soon)
```

## Subtask 2: Developer Documentation

Create comprehensive developer docs in `docs/developer/` documenting all patterns and architecture decisions.

### Files to Create
Break documentation into focused, specific files that match what we're actually building:

1. **`architecture-guide.md`** - High-level overview and mental models
   - State management onion (useState → Zustand → TanStack Query)
   - File organization principles
   - Overall app architecture

2. **`command-system.md`** - How the command system works
   - Command registry patterns
   - How to add new commands
   - Integration with palette, shortcuts, menus

3. **`keyboard-shortcuts.md`** - Keyboard shortcut patterns
   - How to add shortcuts using react-hotkeys-hook
   - Integration with command system
   - useMainWindowEventListeners pattern

4. **`menus.md`** - Native and context menu patterns
   - How to add menu items
   - Menu-command integration
   - Context menu patterns with Tauri v2

5. **`notifications.md`** - Toast and native notification patterns
   - How to send notifications (toast vs native)
   - Integration with error handling
   - Simple notify() function usage

6. **`data-persistence.md`** - Saving data to disk
   - Preferences pattern (atomic writes)
   - Emergency data saving pattern
   - File cleanup strategies

7. **`logging.md`** - Logging patterns
   - Rust and TypeScript logging
   - Console vs system logs
   - Development vs production

8. **`testing.md`** - Testing patterns
   - Unit test structure
   - Integration testing approach
   - check:all command usage

9. **`releases.md`** - Release and deployment
   - prepare-release.js script usage
   - GitHub Actions workflow
   - Auto-updater integration

10. **`auto-updates.md`** - Auto-update system
    - How the update checking works
    - User consent flow
    - GitHub releases integration

### Documentation Principles
- **AI-friendly** - Clear patterns for AI agents to follow
- **Example-driven** - Show code examples, not just descriptions
- **Maintainable** - Easy to update as patterns evolve
- **Complete** - Document all the systems we've built

### Documentation Principles
- **Small and focused** - Each file covers one specific system
- **Pattern-based** - Document actual patterns we've implemented
- **AI-friendly** - Clear examples and step-by-step instructions
- **Future-ready** - Easy to add new files as template grows
- **No invention** - Only document what we've actually built

## Files to Create

### User Guide
- `docs/userguide/userguide.md` (basic user guide)

### Developer Docs (`docs/developer/`)
- `architecture-guide.md` (high-level overview)
- `command-system.md` (command patterns)
- `keyboard-shortcuts.md` (shortcut patterns)
- `menus.md` (menu patterns)
- `notifications.md` (notification patterns)
- `data-persistence.md` (saving to disk patterns)
- `logging.md` (logging patterns)
- `testing.md` (testing patterns)
- `releases.md` (release process)
- `auto-updates.md` (update system)

## Acceptance Criteria
- [ ] User guide covers current keyboard shortcuts and features
- [ ] User guide has "Coming Soon" placeholders for future features
- [ ] Each developer doc file is focused on one specific system
- [ ] All patterns documented match what we've actually implemented
- [ ] Files include step-by-step examples for adding new items
- [ ] Documentation encourages adding new files for new systems
- [ ] All docs are concise and only contain necessary information
- [ ] Structure makes it easy for AI agents to find relevant patterns
