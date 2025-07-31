# Task 3: Simple Data Recovery Pattern

## Overview

Set up a simple pattern for saving important data to disk to prevent data loss, using the same approach as preferences.

**KEEP IT SIMPLE** - Just copy the preferences pattern for saving/loading JSON files.

## What We Need

1. Helper function to save any JSON data to app data directory
2. Cleanup function to remove old files (keep last week)
3. Simple documentation showing the pattern
4. Basic error boundary that can save state before crashes

## Simple Pattern Goal

```typescript
// Simple usage we want:
await saveEmergencyData('user-draft', { content: '...' })
await loadEmergencyData('user-draft')
cleanupOldFiles() // Remove files older than 7 days
```

## Implementation Plan

### 1. Copy Preferences Pattern

- Add `save_emergency_data(filename, data)` Tauri command
- Add `load_emergency_data(filename)` Tauri command
- Use same atomic write pattern as preferences
- Save to `~/Library/Application Support/[app]/recovery/`

### 2. Add Cleanup Function

- `cleanup_old_recovery_files()` Tauri command
- Delete files older than 7 days in recovery directory
- Call on app startup

### 3. Basic Error Boundary

- Simple React error boundary component
- On error, saves current app state to `crash-{timestamp}.json`
- Shows user-friendly error message

### 4. Document the Pattern

- Add to architecture guide with examples
- Show how to save/load user data
- Explain when to use this pattern

## Files to Create/Modify

- `src-tauri/src/lib.rs` (add recovery functions - same pattern as preferences)
- `src/lib/recovery.ts` (simple TypeScript helpers)
- `src/components/ErrorBoundary.tsx` (basic error boundary)
- `src/App.tsx` (add error boundary wrapper)
- `docs/developer/architecture-guide.md` (document pattern)

## Acceptance Criteria

- [ ] Can save/load JSON files using same pattern as preferences
- [ ] Files go to recovery subdirectory in app data
- [ ] Old files are cleaned up automatically on startup
- [ ] Error boundary saves basic app state on crashes
- [ ] Simple documentation with examples
- [ ] No complex recovery UI - just the saving pattern
