# Architecture Guide

High-level architectural overview and mental models for this app.

## Philosophy

1. **Clarity over Cleverness** - Predictable patterns over magic
2. **AI-Friendly Architecture** - Clear patterns that AI agents can follow
3. **Performance by Design** - Patterns that prevent common performance pitfalls
4. **Security First** - Built-in security patterns for file system operations
5. **Extensible Foundation** - Easy to add new features without refactoring

## Mental Models

### The "Onion" State Architecture

State management follows a three-layer hierarchy:

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

See [state-management.md](./state-management.md) for implementation details.

### Event-Driven Bridge

Rust and React communicate through events for loose coupling:

```
Rust Menu Click → Event Emission → React Listener → Command Execution → State Update
Keyboard Shortcut → Event Handler → Command Execution → State Update
Command Palette → Command Selection → Command Execution → State Update
```

This ensures the same actions work consistently across all interaction methods.

### Command-Centric Design

All user actions flow through a centralized [command system](./command-system.md):

- **Commands** are pure objects with `execute()` functions
- **Context** provides all state and actions commands need
- **Registration** merges commands from different domains at runtime

This decouples UI triggers from implementations and enables consistent behavior.

## Pattern Dependencies

Understanding how patterns work together:

```
Command System
├── Depends on: State Management (context)
├── Integrates with: Keyboard Shortcuts, Menus
└── Enables: Consistent behavior across UI

State Management
├── Enables: Performance (getState pattern)
├── Supports: Data Persistence, UI State
└── Foundation for: All other systems

Event-Driven Bridge
├── Enables: Rust-React communication
├── Supports: Security (validation in Rust)
└── Foundation for: Menus, Updates, Notifications
```

## Core Systems

| System               | Documentation                                    |
| -------------------- | ------------------------------------------------ |
| Command System       | [command-system.md](./command-system.md)         |
| Keyboard Shortcuts   | [keyboard-shortcuts.md](./keyboard-shortcuts.md) |
| Native Menus         | [menus.md](./menus.md)                           |
| Quick Panes          | [quick-panes.md](./quick-panes.md)               |
| Data Persistence     | [data-persistence.md](./data-persistence.md)     |
| Internationalization | [i18n-patterns.md](./i18n-patterns.md)           |
| Cross-Platform       | [cross-platform.md](./cross-platform.md)         |

## Component Hierarchy

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

## File Organization

```
locales/                  # Translation JSON files
src/
├── components/
│   ├── layout/          # Layout components (MainWindow, sidebars)
│   ├── command-palette/ # Command palette system
│   ├── preferences/     # Preferences dialog system
│   └── ui/              # Shadcn UI components
├── hooks/               # Custom React hooks
├── i18n/                # Internationalization config
├── lib/
│   ├── commands/        # Command system implementation
│   └── menu.ts          # Native menu builder with i18n
├── services/            # TanStack Query + Tauri integration
├── store/               # Zustand stores
└── types/               # Shared TypeScript types
```

## Multi-Window Architecture

Tauri applications can have multiple windows, each running a separate JavaScript context. Windows cannot share React state directly.

**Key patterns:**

1. **Separate entry points** - Each window has its own HTML file and React root
2. **Event-based communication** - Use Tauri events to communicate between windows
3. **Window reuse** - Create windows once at startup, then show/hide as needed
4. **Theme synchronization** - Emit theme changes so all windows stay in sync

```typescript
// Window A: emit event
await emit('data-updated', { value: 'new data' })

// Window B: listen and react
listen('data-updated', ({ payload }) => {
  setData(payload.value)
})
```

See [quick-panes.md](./quick-panes.md) for a complete implementation example.

## Security Architecture

### Tauri Capabilities

Tauri v2 uses a permission-based capabilities system. Each window only gets the permissions it needs.

**Location:** `src-tauri/capabilities/default.json`

```json
{
  "identifier": "main-capability",
  "windows": ["main"],
  "permissions": ["core:window:allow-minimize", "fs:default"]
}
```

**Key rules:**

- Use specific window labels, not `["*"]`
- Only add permissions actually needed
- Remote content (if any) should have minimal permissions

### Content Security Policy

CSP prevents XSS attacks. Configuration is in `src-tauri/tauri.conf.json`.

**Rules:**

- Never load scripts from CDNs - bundle everything locally
- Avoid `'unsafe-eval'` unless absolutely necessary
- Images: restrict to specific domains when possible

### Secure Storage

| Data Type       | Storage                       | Security Level |
| --------------- | ----------------------------- | -------------- |
| API tokens/keys | OS keychain (`keyring` crate) | High           |
| App preferences | App data directory (JSON)     | Medium         |
| User content    | App data directory/SQLite     | Medium         |

Never store sensitive tokens in `tauri-plugin-store` (plain JSON on disk). See [external-apis.md](./external-apis.md) for keychain patterns.

### Rust-First Security

All file operations happen in Rust with built-in validation:

```rust
fn is_blocked_directory(path: &Path) -> bool {
    let blocked_patterns = ["/System/", "/usr/", "/etc/", "/.ssh/"];
    blocked_patterns.iter().any(|pattern| path.starts_with(pattern))
}
```

### Input Sanitization

```rust
pub fn sanitize_filename(filename: &str) -> String {
    filename.chars()
        .filter(|c| !['/', '\\', ':', '*', '?', '"', '<', '>', '|'].contains(c))
        .collect()
}
```

### Atomic File Operations

All disk writes use atomic operations to prevent corruption:

```rust
// Write to temp file, then rename (atomic)
std::fs::write(&temp_path, content)?;
std::fs::rename(&temp_path, &final_path)?;
```

See [Tauri Security Documentation](https://v2.tauri.app/security/) for detailed guidance.

## Type-Safe Tauri Commands

All Tauri commands use [tauri-specta](https://github.com/specta-rs/tauri-specta) for type safety:

```typescript
// ✅ GOOD: Type-safe with autocomplete
import { commands } from '@/lib/tauri-bindings'

const result = await commands.loadPreferences()
if (result.status === 'ok') {
  console.log(result.data.theme)
}

// ❌ BAD: String-based invoke (no type safety)
const prefs = await invoke<AppPreferences>('load_preferences')
```

See [tauri-commands.md](./tauri-commands.md) for adding new commands.

## Quality Gates

Before any changes are committed:

```bash
npm run check:all
```

See [static-analysis.md](./static-analysis.md) for all tools included.

## Anti-Patterns to Avoid

| Anti-Pattern                    | Why It's Bad                        | Do This Instead               |
| ------------------------------- | ----------------------------------- | ----------------------------- |
| State in wrong layer            | Confuses ownership, breaks patterns | Follow the onion model        |
| Direct Rust-React coupling      | Tight coupling, hard to maintain    | Use command system and events |
| Store subscription in callbacks | Causes render cascades              | Use `getState()` pattern      |
| Skipping input validation       | Security vulnerabilities            | Always validate in Rust       |
| Magic/implicit patterns         | Hard for AI and humans to follow    | Prefer explicit, clear code   |

## Adding New Features

1. **Commands** - Add to appropriate command group file
2. **State** - Choose appropriate layer (useState/Zustand/TanStack Query)
3. **UI** - Follow component architecture
4. **Persistence** - Use established [data-persistence.md](./data-persistence.md) patterns
5. **Testing** - Add tests following [testing.md](./testing.md) patterns
6. **Documentation** - Update relevant docs
