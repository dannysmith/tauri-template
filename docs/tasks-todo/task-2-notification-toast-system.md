# Task 2: Simple Notification System

## Overview

Set up basic notifications so developers can easily send toasts (in-app) or native macOS notifications with a simple API.

**KEEP IT SIMPLE** - Just wire up Sonner + Tauri notifications with a clean interface.

## What We Need

1. Sonner toaster component working in MainWindow
2. Tauri notification plugin configured
3. Simple helper function to send notifications
4. Basic documentation with examples

## Simple API Goal

```typescript
// Simple usage examples we want:
notify('Success!', 'File saved successfully', { type: 'success' })
notify('Error', 'Failed to save file', { type: 'error', native: true })
```

## Implementation Plan

### 1. Set Up Sonner Toasts

- Add `<Toaster />` to MainWindow (Sonner already installed)
- Configure basic positioning and theming
- Test basic toast.success(), toast.error() works

### 2. Configure Tauri Notifications

- Add notification plugin to `tauri.conf.json` capabilities
- Add basic Tauri command for native notifications
- Handle permissions properly

### 3. Create Simple Helper

- Single `notify()` function in `src/lib/notifications.ts`
- Takes title, message, options (type, native)
- Routes to toast or native notification
- Keep it dead simple

### 4. Basic Documentation

- Add to architecture guide with examples
- Show how to use for success/error/info cases

## Files to Create/Modify

- `src/components/layout/MainWindow.tsx` (add Toaster)
- `src-tauri/src/main.rs` (add notify command)
- `src-tauri/tauri.conf.json` (add notification permissions)
- `src/lib/notifications.ts` (simple helper function)
- `docs/developer/architecture-guide.md` (add notification section)

## Acceptance Criteria

- [ ] `<Toaster />` shows toasts in app
- [ ] Native notifications work on macOS
- [ ] Single `notify()` function works for both
- [ ] Basic success/error/info types work
- [ ] Simple documentation with examples
- [ ] No complex services or queue management
