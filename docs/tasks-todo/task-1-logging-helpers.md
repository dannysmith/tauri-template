# Task 1: Simple Logging Setup

## Overview
Set up basic logging patterns so developers know how to log from Rust and TypeScript to macOS system logs in production and console in development.

**KEEP IT SIMPLE** - This is just boilerplate setup and documentation.

## What We Need
1. Tauri log plugin properly configured 
2. Simple examples of how to log from Rust
3. Simple examples of how to log from TypeScript  
4. Clear documentation of the patterns

## Implementation Plan

### 1. Configure Tauri Log Plugin
- Ensure `tauri-plugin-log` is in dependencies (already installed)
- Set up in `main.rs` with appropriate targets
- Configure for development vs production

### 2. Document Rust Logging Pattern
- Use standard Rust `log` crate (already in deps)
- Simple examples: `info!("message")`, `error!("error: {}", e)`
- Document where logs go (console in dev, system in prod)

### 3. Document TypeScript Logging Pattern  
- Use `console.log()` for development
- Use Tauri commands for system logging if needed
- Keep it simple - maybe just console logging is enough

### 4. Add Basic Documentation
- Add logging section to architecture guide
- Simple "how to log" examples for both sides

## Files to Modify
- `src-tauri/src/main.rs` (ensure log plugin configured)
- `docs/developer/architecture-guide.md` (add logging section)
- Maybe: simple logger utility if helpful

## Acceptance Criteria
- [ ] Tauri log plugin works correctly
- [ ] Clear examples of Rust logging 
- [ ] Clear examples of TypeScript logging
- [ ] Logs appear in macOS Console.app in production
- [ ] Simple documentation exists
