# Global Shortcut and Quick Pane System

## Overview

Add a template for a globally-accessible quick entry panel using tauri-nspanel plugin.

## Key Areas

### Quick Pane Component

- Create a new view using tauri-nspanel plugin
- Small component that renders in a separate panel/window
- Accepts input (typed or other)

### Global Keyboard Shortcut

- Launch the quick pane via a globally-available keyboard shortcut

### Cross-Window State Management

- Properly write to store from the separate window
- Integrate with existing React-based state management system
- Handle state synchronization between windows

### Use Cases

This pattern is common for:

- Quick entry panels
- Quick dictation panels
- Command palettes
- Similar quick-access features

## Tasks

- [ ] TBD

## Notes

This is potentially a fairly large piece of work due to the cross-window state management requirements.
