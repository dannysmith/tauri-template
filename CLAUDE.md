# Claude Instructions

## Current Status

@CLAUDE.local.md

## Overview

This repository is a template with sensible defaults for building Tauri React apps.

## Core Rules

### New Sessions

- Read @docs/TASKS.md for task management
- Review `docs/developer/architecture-guide.md` for patterns
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
10. **Documentation**: Update `docs/developer/architecture-guide.md` for new patterns
11. **Removing files**: Always use `rm -f`

### Documentation & Versions

- **Context7 First**: Always use Context7 for framework docs before WebSearch
- **Version Requirements**: Tauri v2.x, shadcn/ui v4.x, Tailwind v4.x, React 19.x, Zustand v5.x, Vitest v3.x
