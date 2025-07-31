# Task 11: Other Boilerplate Files

## Overview

Add essential boilerplate files that any open-source project needs, plus a placeholder icon system.

## Checklist

### Part 1: Standard Open-Source Boilerplate

- [ ] **`.cursorignore`** - Ignore patterns for Cursor AI
- [ ] **`LICENSE.md`** - AGPL-3.0-or-later license (matches package.json)
- [ ] **`README.md`** - Update main README to be template-focused
- [ ] **`docs/SECURITY.md`** - Basic security policy template
- [ ] **`docs/CONTRIBUTING.md`** - Contributing guidelines template

### Part 2: Icon System

- [ ] **Create `icon.svg`** - Placeholder icon for macOS
  - Proper macOS icon proportions and padding
  - Simple, clean design that works as template
  - Right size/shape for Tauri icon generation
- [ ] **Add icon documentation** - How to use the icon system
  - Document `npm run tauri icon icon.svg` command
  - Explain how it generates all platform icons
  - Show where generated icons go (`src-tauri/icons/`)

- [ ] **Test icon generation** - Verify the process works
  - Run Tauri icon command on the SVG
  - Check generated icons look correct
  - Update `.gitignore` if needed for generated files

## Files to Create

- `.cursorignore`
- `LICENSE.md`
- `README.md` (update existing)
- `docs/SECURITY.md`
- `docs/CONTRIBUTING.md`
- `icon.svg` (placeholder macOS icon)
- `docs/developer/icons.md` (icon usage documentation)

## Notes

- All files should be templates/placeholders that work for any app
- Icon should be generic but professional-looking
- Documentation should explain how to customize for specific apps
