# Tauri React Template

A "batteries-included" template for building production-ready desktop applications with **Tauri v2**, **React**, and **TypeScript**. Designed with opinionated patterns that help both human developers and AI coding agents build well-architected apps from the start.

## Why This Template?

Most Tauri starters give you a blank canvas. This template gives you a **working application** with patterns already established:

- **Type-safe Rust-TypeScript bridge** via tauri-specta.
- **Performance patterns enforced by tooling** - all the usual linting plus ast-grep for common anti-patterns
- **Multi-window architecture** already working (quick pane with global shortcut as a demo)
- **Cross-platform ready** with platform-specific title bars, window controls, and native menu integration
- **i18n built-in** with RTL support

## Stack

| Layer    | Technologies                                    |
| -------- | ----------------------------------------------- |
| Frontend | React 19, TypeScript, Vite 7                    |
| UI       | shadcn/ui v4, Tailwind CSS v4, Lucide React     |
| State    | Zustand v5, TanStack Query v5                   |
| Backend  | Tauri v2, Rust                                  |
| Testing  | Vitest v4, Testing Library                      |
| Quality  | ESLint, Prettier, ast-grep, knip, jscpd, clippy |

## What's Already Built

The template includes a working application with these features implemented:

### Core Features

- **Command Palette** (`Cmd+K`) - Searchable command launcher with keyboard navigation
- **Quick Pane** - Global shortcut (`Cmd+Shift+.`) opens a floating window from any app, even fullscreen. Uses native NSPanel on macOS for proper fullscreen overlay behavior.
- **Keyboard Shortcuts** - Platform-aware shortcuts with automatic menu integration
- **Native Menus** - File, Edit, View menus built from JavaScript with full i18n support
- **Preferences System** - Settings dialog with Rust-side persistence, React hooks, and type-safe access throughout
- **Collapsible Sidebars** - Empty left and right sidebars with state persistence via resizable panels
- **Theme System** - Light/dark mode with system preference detection, synced across windows
- **Notifications** - Toast notifications for in-app feedback, plus native system notifications
- **Auto-updates** - Tauri updater plugin configured with GitHub Releases integration and update checking on launch
- **Logging** - Structured logging utilities for both Rust and TypeScript with consistent formatting
- **Crash Recovery** - Emergency data persistence for recovering unsaved work after unexpected exits

### Architecture Patterns

- **Three-layer state management** - Clear decision tree: `useState` (component) → `Zustand` (global UI) → `TanStack Query` (persistent data "not owned by the app)
- **Event-driven Rust-React bridge** - Menus, shortcuts, and command palette all route through the same command system
- **React Compiler** - Automatic memoization means no manual `useMemo`/`useCallback` needed

### Cross-Platform

| Platform | Title Bar            | Window Controls | Bundle Format |
| -------- | -------------------- | --------------- | ------------- |
| macOS    | Custom with vibrancy | Traffic lights  | `.dmg`        |
| Windows  | Custom               | Right side      | `.msi`        |
| Linux    | Native + toolbar     | Native          | `.AppImage`   |

Platform detection utilities, platform-specific UI strings ("Reveal in Finder" vs "Show in Explorer"), and separate Tauri configs per platform are all set up.

### Developer Experience

- **Type-safe Tauri commands** - tauri-specta generates TypeScript bindings from Rust, with full autocomplete and compile-time checking
- **Static analysis** - ESLint, Prettier, ast-grep (architecture enforcement), knip (unused code), jscpd (duplication)
- **Single quality gate** - `npm run check:all` runs TypeScript, ESLint, Prettier, ast-grep, clippy, and all tests
- **Testing patterns** - Vitest setup with Tauri command mocking

## Tauri Plugins Included

| Plugin            | Purpose                          |
| ----------------- | -------------------------------- |
| single-instance   | Prevent multiple app instances   |
| window-state      | Remember window position/size    |
| fs                | File system access               |
| dialog            | Native open/save dialogs         |
| notification      | System notifications             |
| clipboard-manager | Clipboard access                 |
| global-shortcut   | System-wide keyboard shortcuts   |
| updater           | In-app auto-updates              |
| opener            | Open URLs/files with default app |
| tauri-nspanel     | macOS floating panel behavior    |

## AI-Ready Development

This template is designed to work well with AI coding agents like Claude Code:

- **Comprehensive documentation** in `docs/developer/` covering all patterns. Human readable but really designed to explain the "why" of certain patterns to AI agents. Not slop.
- **Claude Code integration** - Custom commands (`/check`, `/cleanup`) and a couple of specialized agents
- **Sensible file organization** - React code in `src/` with clear separation (components, hooks, stores, services), Rust in `src-tauri/src/` with modular command organization. Predictable structure for both humans and AI.

## Getting Started

See **[Using This Template](docs/USING_THIS_TEMPLATE.md)** for setup instructions and workflow guidance.

### Quick Start

```bash
# Prerequisites: Node.js 18+, Rust (latest stable)
# See https://tauri.app/start/prerequisites/ for platform-specific deps

git clone <your-repo>
cd your-app
npm install
npm run dev
```

## Documentation

- **[Developer Docs](docs/developer/)** - Architecture, patterns, and detailed guides
- **[User Guide](docs/userguide/)** - End-user documentation template
- **[Using This Template](docs/USING_THIS_TEMPLATE.md)** - Setup and workflow guide

## License

[MIT](LICENSE.md)

---

Built with [Tauri](https://tauri.app) | [shadcn/ui](https://ui.shadcn.com) | [React](https://react.dev)
