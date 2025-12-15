# Cross Platform Support

## Overview

Ensure the template properly supports Windows, macOS, and Linux.

## Key Areas

### Path Handling
- All path reading/writing should use Tauri Rust APIs properly for cross-platform compatibility

### Unified Title Bar Decomposition
- Decompose the unified title bar to allow swapping different implementations per OS
- **macOS**: Current fake title bar approach works
- **Windows**: Create fake title bar with window controls on the right
- **Linux**: Use Tauri native title bar, render custom title bar content underneath without window controls

### OS Detection Helpers
- Add helpers to determine current OS in React code
- Add helpers to determine current OS in Rust code

### Build & Deployment
- Add build steps to build correct artifacts per platform
- Update deployment pipeline accordingly

### Audit
- Check for any other OS-specific issues throughout the codebase

## Tasks

- [ ] TBD

## Notes

