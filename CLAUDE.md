# Claude Instructions

## Current Status

@CLAUDE.local.md

## Overview

This repository is a template with sensible defaults for building Tauri React apps.

## Core Rules

### New Sessions

- Read @docs/tasks.md for task management
- Review `docs/developer/architecture-guide.md` for high-level patterns
- Check `docs/developer/` for system-specific patterns (command-system.md, performance-patterns.md, etc.)
- Check git status and project structure

### Development Practices

**CRITICAL:** Follow these strictly:

1. **Read Before Editing**: Always read files first to understand context
2. **Follow Established Patterns**: Use patterns from this file and `docs/developer`
3. **Senior Architect Mindset**: Consider performance, maintainability, testability
4. **Batch Operations**: Use multiple tool calls in single responses
5. **Match Code Style**: Follow existing formatting and patterns
6. **Test Coverage**: Write comprehensive tests for business logic
7. **Quality Gates**: Run `npm run check:all` after significant changes
8. **No Dev Server**: Ask user to run and report back
9. **No Unsolicited Commits**: Only when explicitly requested
10. **Documentation**: Update relevant `docs/developer/` files for new patterns
11. **Removing files**: Always use `rm -f`

**CRITICAL:** Use Tauri v2 docs only. Always use modern Rust formatting: `format!("{variable}")`

## Architecture Patterns (CRITICAL)

### State Management Onion

```
useState (component) → Zustand (global UI) → TanStack Query (persistent data)
```

**Decision**: Is data needed across components? → Does it persist between sessions?

### Performance Pattern (CRITICAL)

```typescript
// ✅ GOOD: Use getState() to avoid render cascades
const handleAction = useCallback(() => {
  const { data, setData } = useStore.getState()
  setData(newData)
}, []) // Empty deps = stable

// ❌ BAD: Store subscriptions cause cascades
const { data, setData } = useStore()
const handleAction = useCallback(() => {
  setData(newData)
}, [data, setData]) // Re-creates constantly
```

### Event-Driven Bridge

- **Rust → React**: `app.emit("event-name", data)` → `listen("event-name", handler)`
- **React → Rust**: `invoke("command_name", args)` with TanStack Query
- **Commands**: All actions flow through centralized command system

### Documentation & Versions

- **Context7 First**: Always use Context7 for framework docs before WebSearch
- **Version Requirements**: Tauri v2.x, shadcn/ui v4.x, Tailwind v4.x, React 18.x, Zustand v5.x, Vitest v3.x
