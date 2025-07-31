# Architecture Guide

High-level architectural overview and mental models for building Tauri + React applications with this template.

## Philosophy

This template follows these core principles:

1. **Clarity over Cleverness** - Predictable patterns over magic
2. **AI-Friendly Architecture** - Clear patterns that AI agents can follow
3. **Performance by Design** - Patterns that prevent common performance pitfalls
4. **Security First** - Built-in security patterns for file system operations
5. **Extensible Foundation** - Easy to add new features without refactoring

## Mental Models

### The "Onion" State Architecture

State management follows a clear three-layer hierarchy:

```
┌─────────────────────────────────────┐
│           useState                  │  ← Component UI State
│  ┌─────────────────────────────────┐│
│  │          Zustand                ││  ← Global UI State
│  │  ┌─────────────────────────────┐││
│  │  │      TanStack Query         │││  ← Persistent Data
│  │  └─────────────────────────────┘││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

**Decision Tree:**

```
Is this data needed across multiple components?
├─ No → useState
└─ Yes → Does this data persist between app sessions?
    ├─ No → Zustand
    └─ Yes → TanStack Query
```

See [state-management.md](./state-management.md) for detailed patterns.

### Event-Driven Bridge Architecture

Rust and React communicate through events for loose coupling:

```
Rust Menu Click → Event Emission → React Listener → Command Execution → State Update
Keyboard Shortcut → Event Handler → Command Execution → State Update
Command Palette → Command Selection → Command Execution → State Update
```

This ensures the same actions work consistently across all interaction methods.

### Command-Centric Design

All user actions flow through a centralized command system:

- **Commands** are pure objects with `execute()` functions
- **Context** provides all state and actions commands need
- **Registration** merges commands from different domains at runtime

This decouples UI triggers from implementations and enables consistent behavior.

## System Architecture

### Core Systems

Each major system has focused documentation:

- **[Command System](./command-system.md)** - Unified action dispatch
- **[Keyboard Shortcuts](./keyboard-shortcuts.md)** - Native event handling
- **[Native Menus](./menus.md)** - Cross-platform menu integration
- **[Data Persistence](./data-persistence.md)** - Disk storage patterns
- **[Notifications](./notifications.md)** - Toast and native notifications
- **[Logging](./logging.md)** - Rust and TypeScript logging
- **[Testing](./testing.md)** - Quality gates and test patterns
- **[Releases](./releases.md)** - Automated release process
- **[Auto-Updates](./auto-updates.md)** - Update system integration

### Component Hierarchy

```
MainWindow (Top-level orchestrator)
├── TitleBar (Window controls + toolbar)
├── LeftSidebar (Collapsible panel)
├── MainWindowContent (Primary content area)
├── RightSidebar (Collapsible panel)
└── Global Overlays
    ├── PreferencesDialog (Settings)
    ├── CommandPalette (Cmd+K)
    └── Toaster (Notifications)
```

### File Organization

```
src/
├── components/
│   ├── layout/          # Layout components (MainWindow, sidebars)
│   ├── command-palette/ # Command palette system
│   ├── preferences/     # Preferences dialog system
│   └── ui/              # Shadcn UI components
├── hooks/               # Custom React hooks
├── lib/
│   └── commands/        # Command system implementation
├── services/            # TanStack Query + Tauri integration
├── store/               # Zustand stores
└── types/               # Shared TypeScript types
```

## Performance Patterns

### The `getState()` Pattern (Critical)

**Problem**: Store subscriptions in callbacks cause render cascades.

**Solution**: Use `getState()` for callbacks that need current state:

```typescript
// ✅ Good: Stable callback, no cascades
const handleAction = useCallback(() => {
  const { currentData, updateData } = useStore.getState()
  updateData(currentData.modified)
}, []) // Empty deps - stable reference

// ❌ Bad: Re-creates on every state change
const { currentData, updateData } = useStore()
const handleAction = useCallback(() => {
  updateData(currentData.modified)
}, [currentData, updateData]) // Cascades on every change
```

See [performance-patterns.md](./performance-patterns.md) for complete patterns.

## Security Architecture

### Rust-First Security

All file operations happen in Rust with built-in validation:

```rust
// Path validation prevents traversal attacks
fn is_blocked_directory(path: &Path) -> bool {
    let blocked_patterns = ["/System/", "/usr/", "/etc/", "/.ssh/"];
    blocked_patterns.iter().any(|pattern| path.starts_with(pattern))
}
```

### Input Sanitization

```rust
// Filename sanitization
pub fn sanitize_filename(filename: &str) -> String {
    filename.chars()
        .filter(|c| !['/', '\\', ':', '*', '?', '"', '<', '>', '|'].contains(c))
        .collect()
}
```

## Integration Patterns

### Multi-Source Event Coordination

The same action can be triggered from multiple sources:

```typescript
// All trigger the same command
handleKeyboard('cmd+comma') → commandContext.openPreferences()
handleMenu('menu-preferences') → commandContext.openPreferences()
handleCommand('open-preferences') → commandContext.openPreferences()
```

### Atomic File Operations

All disk writes use atomic operations to prevent corruption:

```rust
// Write to temp file, then rename (atomic)
std::fs::write(&temp_path, content)?;
std::fs::rename(&temp_path, &final_path)?;
```

## Development Workflow

### Quality Gates

Before any changes are committed:

```bash
npm run check:all  # Runs all checks
```

This includes:

- TypeScript type checking
- ESLint linting
- Prettier formatting
- Vitest tests
- Rust formatting (cargo fmt)
- Rust linting (clippy)
- Rust tests

### Documentation-Driven Development

1. **Understand patterns** - Read relevant docs in `docs/developer/`
2. **Follow established patterns** - Don't invent new approaches
3. **Update docs** - Document new patterns as they emerge
4. **Test comprehensively** - Use the established testing patterns

## Extension Points

### Adding New Features

1. **Commands** - Add to appropriate command group file
2. **State** - Choose appropriate layer (useState/Zustand/TanStack Query)
3. **UI** - Follow component architecture guidelines
4. **Persistence** - Use established data persistence patterns
5. **Testing** - Add tests following established patterns
6. **Documentation** - Update relevant docs

### Adding New Systems

When adding entirely new systems:

1. **Create focused docs** - Add new file to `docs/developer/`
2. **Follow architectural patterns** - Use established bridge patterns
3. **Integrate with command system** - Make actions discoverable
4. **Add keyboard shortcuts** - Follow shortcut conventions
5. **Update this guide** - Add system to architecture overview

## Best Practices Summary

1. **Follow the onion** - Use the three-layer state architecture
2. **Commands everywhere** - Route all actions through the command system
3. **Performance first** - Use `getState()` pattern to avoid cascades
4. **Security by default** - Validate all inputs, especially file paths
5. **Event-driven bridges** - Keep Rust and React loosely coupled
6. **Test everything** - Use quality gates to maintain code health
7. **Document patterns** - Keep docs current as patterns evolve

This architecture provides a solid foundation for building maintainable, performant, and secure desktop applications with Tauri and React.
