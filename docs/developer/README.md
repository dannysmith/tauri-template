# Developer Documentation

Technical documentation for building and extending this app. These docs describe established patterns and are intended for both human developers and AI coding agents.

## Architecture & Patterns

| Document                                      | Description                                             |
| --------------------------------------------- | ------------------------------------------------------- |
| [Architecture Guide](./architecture-guide.md) | High-level overview, mental models, system architecture |
| [Rust Architecture](./rust-architecture.md)   | Rust module organization and patterns                   |
| [State Management](./state-management.md)     | Three-layer state onion, Zustand, TanStack Query        |
| [Error Handling](./error-handling.md)         | Error propagation, user feedback, retry patterns        |

## Core Systems

| Document                                      | Description                                     |
| --------------------------------------------- | ----------------------------------------------- |
| [Command System](./command-system.md)         | Unified action dispatch, command registration   |
| [Keyboard Shortcuts](./keyboard-shortcuts.md) | Global shortcut handling, platform modifiers    |
| [Menus](./menus.md)                           | Native menu building with i18n                  |
| [Quick Panes](./quick-panes.md)               | Multi-window quick entry pattern                |
| [Tauri Commands](./tauri-commands.md)         | Type-safe Rust-TypeScript bridge (tauri-specta) |
| [Tauri Plugins](./tauri-plugins.md)           | Plugin usage and configuration                  |

## UI & UX

| Document                                   | Description                                 |
| ------------------------------------------ | ------------------------------------------- |
| [UI Patterns](./ui-patterns.md)            | CSS architecture, shadcn/ui components      |
| [Internationalization](./i18n-patterns.md) | Translation system, RTL support             |
| [Notifications](./notifications.md)        | Toast and native notifications              |
| [Cross-Platform](./cross-platform.md)      | Platform detection, OS-specific adaptations |

## Data & Storage

| Document                                  | Description                                  |
| ----------------------------------------- | -------------------------------------------- |
| [Data Persistence](./data-persistence.md) | File storage patterns, atomic writes, SQLite |
| [External APIs](./external-apis.md)       | HTTP API calls, authentication, caching      |

## Quality & Tooling

| Document                                              | Description                                             |
| ----------------------------------------------------- | ------------------------------------------------------- |
| [Static Analysis](./static-analysis.md)               | ESLint, Prettier, ast-grep, knip, jscpd, React Compiler |
| [Writing ast-grep Rules](./writing-ast-grep-rules.md) | AI reference for creating custom rules                  |
| [Testing](./testing.md)                               | Test patterns, Tauri mocking                            |
| [Bundle Optimization](./bundle-optimization.md)       | Bundle size management                                  |
| [Logging](./logging.md)                               | Rust and TypeScript logging                             |
| [Writing Docs](./writing-docs.md)                     | Guide for creating and maintaining these docs           |

## Release & Distribution

| Document                  | Description                            |
| ------------------------- | -------------------------------------- |
| [Releases](./releases.md) | Release process, signing, auto-updates |

---

**Updating these docs:** When adding new patterns or systems, update the relevant doc file and add a link here if creating a new document.
