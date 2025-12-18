# Task: Switch from Radix to Base UI in shadcn

## Executive Summary

**Recommendation: Proceed with migration**

Since the UI components in `src/components/ui/` are standard shadcn components, they can be replaced via the shadcn CLI. The actual work is limited to:
1. Updating 1 consumer file that uses `asChild` (`PreferencesDialog.tsx`)
2. Verifying the custom `CommandDialog` wrapper works with the new Dialog
3. Testing all component usages

---

## Migration Strategy

### Phase 1: Preparation

1. **Create a migration branch**
2. **Document current behavior** - Screenshot/test the Preferences dialog, Command palette, and DatePicker

### Phase 2: Replace UI Components via CLI

The shadcn CLI can regenerate components for Base UI. The approach:

```bash
# Remove all current UI components
rm -rf src/components/ui/*

# Re-initialize shadcn with Base UI
npx shadcn@latest init --base base

# Add back required components
npx shadcn@latest add alert alert-dialog badge breadcrumb button calendar card checkbox command dialog dropdown-menu input label popover radio-group resizable scroll-area select separator sheet skeleton sonner switch toggle toggle-group tooltip
```

**Note:** The `sidebar` component will need special handling (see Phase 3).

### Phase 3: Handle Special Cases

#### 3.1 Sidebar Component

The sidebar uses `@radix-ui/react-slot` directly for `asChild` pattern. Options:

**Option A (Recommended):** Use shadcn's Base UI sidebar if available
```bash
npx shadcn@latest add sidebar
```

**Option B:** If not available, manually update to use `useRender` from Base UI:
```tsx
// Before (Radix)
import { Slot } from '@radix-ui/react-slot'
const Comp = asChild ? Slot : 'button'

// After (Base UI)
import { useRender } from '@base-ui-components/react/use-render'
// Use render prop pattern instead
```

#### 3.2 CommandDialog Wrapper

The custom `CommandDialog` in `command.tsx` wraps the Dialog component. After Dialog is replaced:
- Verify it still works (it just passes props through)
- The `cmdk` library is independent of Radix/Base UI

#### 3.3 DatePicker Component

Uses `PopoverTrigger asChild`. After Base UI migration:
```tsx
// Before
<PopoverTrigger asChild>
  <Button>...</Button>
</PopoverTrigger>

// After
<PopoverTrigger render={<Button />}>
  ...
</PopoverTrigger>
```

---

## Consumer Code Changes Required

Based on codebase analysis, only **1 file** outside `components/ui/` uses the `asChild` prop:

### `src/components/preferences/PreferencesDialog.tsx` (Line 80)

```tsx
// Current (Radix pattern)
<SidebarMenuButton asChild isActive={activePane === item.id}>
  <button onClick={() => setActivePane(item.id)} className="w-full">
    <item.icon />
    <span>{t(item.labelKey)}</span>
  </button>
</SidebarMenuButton>

// After (Base UI pattern)
<SidebarMenuButton
  isActive={activePane === item.id}
  render={<button onClick={() => setActivePane(item.id)} className="w-full" />}
>
  <item.icon />
  <span>{t(item.labelKey)}</span>
</SidebarMenuButton>
```

---

## API Changes Reference

| Radix Pattern | Base UI Pattern |
|--------------|-----------------|
| `asChild` prop | `render` prop |
| `<Content side="left">` | `<Positioner side="left"><Content>` |
| `onValueChange` | `onValueChange` (same) |
| `onOpenChange` | `onOpenChange` (same) |
| `onCheckedChange` | `onCheckedChange` (same) |
| `data-[state=open]` | `data-open` |
| `data-[state=closed]` | `data-closed` |

---

## Component Usage Summary

| Component | Usage Location | Risk | Notes |
|-----------|---------------|------|-------|
| Select | AppearancePane, AdvancedPane | Low | Standard controlled usage, no asChild |
| Dialog | PreferencesDialog, command.tsx | Low | Standard controlled usage |
| Button | TitleBar, MainWindow, etc. | Low | Simple props: variant, size, onClick |
| Switch | GeneralPane, AdvancedPane | Low | Standard onCheckedChange |
| Popover | date-picker.tsx | Medium | asChild on trigger - in UI folder |
| Sidebar | PreferencesDialog | Medium | asChild on MenuButton |
| Command | CommandPalette | Low | Custom wrapper, uses cmdk directly |
| Resizable | MainWindow | Low | No Radix dependencies |
| Breadcrumb | PreferencesDialog | Low | Simple static usage |
| Input/Label | Various panes | Low | Standard form controls |

---

## Migration Checklist

### Pre-Migration
- [ ] Create feature branch `feature/switch-to-baseui`
- [ ] Run `npm run check:all` to ensure clean baseline
- [ ] Document/screenshot current UI behavior

### UI Component Replacement
- [ ] Remove existing `src/components/ui/*` files
- [ ] Initialize shadcn with Base UI base
- [ ] Add all required components via CLI
- [ ] Handle sidebar component (check if shadcn provides Base UI version)

### Consumer Code Updates
- [ ] Update `PreferencesDialog.tsx` - change `asChild` to `render` pattern
- [ ] Verify `date-picker.tsx` works (should be replaced by CLI)
- [ ] Verify `CommandDialog` wrapper in `command.tsx` still works

### CSS/Styling Adjustments
- [ ] Update any CSS selectors using `data-[state=open]` to `data-open`
- [ ] Update any CSS selectors using `data-[state=closed]` to `data-closed`
- [ ] Check Tailwind classes in component usages

### Testing
- [ ] Test Preferences Dialog opens/closes
- [ ] Test all preference panes (General, Appearance, Advanced)
- [ ] Test Select dropdowns work correctly
- [ ] Test Switch toggles work
- [ ] Test Command Palette (Cmd+K)
- [ ] Test DatePicker if used
- [ ] Test sidebar navigation in preferences
- [ ] Test mobile responsive behavior (Sheet for sidebar)
- [ ] Run `npm run check:all`
- [ ] Run `npm run test:run`

### Post-Migration
- [ ] Update package.json - remove `@radix-ui/*` packages
- [ ] Verify bundle size improvement
- [ ] Update any relevant documentation

---

## Dependency Changes

### Remove (15 packages)
```
@radix-ui/react-alert-dialog
@radix-ui/react-checkbox
@radix-ui/react-dialog
@radix-ui/react-dropdown-menu
@radix-ui/react-label
@radix-ui/react-popover
@radix-ui/react-radio-group
@radix-ui/react-scroll-area
@radix-ui/react-select
@radix-ui/react-separator
@radix-ui/react-slot
@radix-ui/react-switch
@radix-ui/react-toggle
@radix-ui/react-toggle-group
@radix-ui/react-tooltip
```

### Add (1 package)
```
@base-ui-components/react
```

---

## Estimated Effort

| Task | Effort |
|------|--------|
| UI component replacement via CLI | ~30 min |
| PreferencesDialog.tsx update | ~15 min |
| CSS selector updates (if needed) | ~15 min |
| Testing all functionality | ~1 hour |
| **Total** | **~2 hours** |

---

## Rollback Plan

If issues arise:
1. `git checkout main -- src/components/ui/`
2. `git checkout main -- src/components/preferences/PreferencesDialog.tsx`
3. `npm install` to restore Radix dependencies

---

## Sources

- [basecn - Migrating from Radix UI](https://basecn.dev/docs/get-started/migrating-from-radix-ui)
- [Base UI useRender documentation](https://base-ui.com/react/utils/use-render)
- [jscodeshift codemod for asChild → render](https://gist.github.com/phibr0/48ac88eafbd711784963a3b72015fd09)
- [shadcn/ui Changelog](https://ui.shadcn.com/docs/changelog)
- [Base UI v1.0 Release](https://base-ui.com/react/overview/releases)
