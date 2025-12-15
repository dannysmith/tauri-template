# Rework CSS and Component Architecture

## Overview

Review and modernize CSS usage, Tailwind/shadcn patterns, and React component architecture. This is primarily a review task - the template is already fairly modern, but we should ensure it follows latest best practices and provides clear patterns for template users.

## Current State Assessment

### What's Already Good

- **Tailwind v4.1.18** with modern CSS-based config (`@import 'tailwindcss'`, `@theme inline`)
- **OKLCH colors** - modern color space with better perceptual uniformity
- **Proper dark mode** via `.dark` class and `@custom-variant dark`
- **Desktop-specific base styles** - user-select, overscroll-behavior, cursor defaults
- **shadcn/ui v4** components with latest patterns
- **Clean component organization** - layout/, titlebar/, preferences/, ui/

### Areas to Review

1. **Dark mode implementation** - Could potentially use CSS `light-dark()` function
2. **Component architecture violations** - Some components destructure from Zustand stores
3. **CSS organization** - All in App.css, could benefit from structure
4. **Component patterns** - Ensure consistency and provide clear examples

---

## Phase 1: CSS Modernization Review

**Goal:** Ensure CSS uses latest browser features where beneficial.

### Tasks

1. **Evaluate `light-dark()` CSS function**
   - [ ] Research if `light-dark()` would simplify our dark mode approach
   - [ ] Consider `color-scheme: light dark` on `:root`
   - [ ] Determine if change is worthwhile vs current `.dark` class approach
   - [ ] Document decision either way

2. **Review base styles**
   - [ ] Audit `@layer base` styles in App.css
   - [ ] Check if any modern CSS reset patterns should be added
   - [ ] Ensure Tauri/desktop-specific styles are well documented

3. **Review Tailwind v4 patterns**
   - [ ] Confirm we're using CSS-based config correctly
   - [ ] Check for any deprecated patterns from v3
   - [ ] Ensure `@theme inline` variables are organized

### Notes

The current dark mode approach (`.dark` class + CSS variables) works well and is the standard shadcn/ui pattern. The `light-dark()` function is newer but may not integrate as cleanly with Tailwind's class-based system. Decision should prioritize compatibility with shadcn/ui.

**References:**

- [CSS light-dark() function](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark)
- [Tailwind Dark Mode](https://tailwindcss.com/docs/dark-mode)

---

## Phase 2: Component Architecture Fixes

**Goal:** Fix any architectural violations and ensure components follow our patterns.

### Known Issues

1. **MainWindow.tsx (line 20-21)** - Destructures from useUIStore:

   ```typescript
   // ❌ Current (causes render cascades)
   const { leftSidebarVisible, rightSidebarVisible } = useUIStore()

   // ✅ Should be
   const leftSidebarVisible = useUIStore(state => state.leftSidebarVisible)
   const rightSidebarVisible = useUIStore(state => state.rightSidebarVisible)
   ```

2. **TitleBar.tsx (line 20-25)** - Same issue, destructures multiple values

### Tasks

1. **Fix Zustand usage patterns**
   - [ ] Update MainWindow.tsx to use selector syntax
   - [ ] Update TitleBar.tsx to use selector syntax
   - [ ] Audit other components for similar issues
   - [ ] Verify ast-grep rules catch these (from task-3)

2. **Review component prop interfaces**
   - [ ] Ensure consistent interface naming (`*Props`)
   - [ ] Check for appropriate use of `className` prop
   - [ ] Verify `children` handling is consistent

3. **Review layout components**
   - [ ] LeftSideBar, RightSideBar - simple wrappers, may be fine
   - [ ] MainWindowContent - verify slot pattern is clear
   - [ ] Consider if any abstractions would help template users

---

## Phase 3: Documentation and Guidelines

**Goal:** Create clear documentation for UI patterns in this template.

### Tasks

1. **Create UI patterns documentation**
   - [ ] Create `docs/developer/ui-patterns.md`
   - [ ] Document Tailwind v4 CSS-based config approach
   - [ ] Document dark mode pattern and color variables
   - [ ] Document component organization structure
   - [ ] Provide examples for common patterns

2. **Document shadcn/ui usage**
   - [ ] How to add new shadcn components
   - [ ] How to customize components
   - [ ] Which components are included vs available

3. **Update architecture guide**
   - [ ] Add section on styling approach
   - [ ] Reference UI patterns doc
   - [ ] Note desktop-specific considerations (user-select, etc.)

### Documentation Outline

```markdown
# UI Patterns Guide

## Styling Approach

- Tailwind v4 with CSS-based config
- shadcn/ui for components
- OKLCH color space

## Dark Mode

- Uses `.dark` class on `<html>`
- CSS variables in App.css
- ThemeProvider for React context

## Component Organization

- ui/ - shadcn primitives
- layout/ - app structure
- titlebar/ - window chrome
- preferences/ - settings UI

## Adding New Components

- shadcn CLI usage
- Customization patterns

## Desktop-Specific Styles

- User selection disabled by default
- Cursor defaults to 'default'
- Overscroll behavior prevented
```

---

## Phase 4: Final Review

**Goal:** Ensure everything works together and is well documented.

### Tasks

1. **Visual review**
   - [ ] Check light mode appearance
   - [ ] Check dark mode appearance
   - [ ] Verify all components render correctly

2. **Run checks**
   - [ ] `pnpm run check:all` passes
   - [ ] No CSS warnings or errors
   - [ ] ast-grep rules pass (no Zustand destructuring)

3. **Update CLAUDE.md**
   - [ ] Reference UI patterns documentation
   - [ ] Note any CSS conventions

---

## Files to Review/Modify

### CSS

| File          | Action                         |
| ------------- | ------------------------------ |
| `src/App.css` | Review, potentially reorganize |

### Components to Fix

| File                                   | Issue                     |
| -------------------------------------- | ------------------------- |
| `src/components/layout/MainWindow.tsx` | Fix Zustand destructuring |
| `src/components/titlebar/TitleBar.tsx` | Fix Zustand destructuring |

### Documentation to Create

| File                                   | Purpose                     |
| -------------------------------------- | --------------------------- |
| `docs/developer/ui-patterns.md`        | **CREATE** - UI guidelines  |
| `docs/developer/architecture-guide.md` | Update with styling section |

---

## Out of Scope

- Major component redesign (this is a template, not a full app)
- Changing shadcn/ui components themselves
- Complex theming beyond light/dark
- Significant layout restructuring

---

## Success Criteria

1. All components follow Zustand selector pattern (no destructuring)
2. CSS is well-organized and documented
3. Clear documentation for template users on UI patterns
4. `pnpm run check:all` passes
5. ast-grep rules pass

---

## References

- [CSS light-dark()](https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/light-dark)
- [CSS color-scheme](https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme)
- [Tailwind v4 CSS Config](https://tailwindcss.com/docs/configuration)
- [shadcn/ui](https://ui.shadcn.com/)
