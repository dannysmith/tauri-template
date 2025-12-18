# Task: Switch from Radix to Base UI in shadcn

## Approach

**Test on a branch.** If it works, merge. If it doesn't, close the branch and move on.

This is a low-risk experiment because:
- All UI components are standard shadcn components (replaceable via CLI)
- Only 1 consumer file uses `asChild` pattern
- The branch can simply be deleted if migration fails

---

## Step-by-Step Instructions for AI Agent

Follow these steps exactly in order. Do not skip steps. If any step fails, stop and report the error.

### Step 1: Create Branch and Verify Clean State

```bash
git checkout -b feature/switch-to-baseui
npm run check:all
```

**Expected:** All checks pass. If not, fix issues before proceeding.

### Step 2: Remove All Current UI Components

```bash
rm -f src/components/ui/*
```

**Expected:** The `src/components/ui/` directory is now empty.

### Step 3: Re-initialize shadcn with Base UI

Run the interactive CLI:

```bash
npx shadcn@latest init
```

When prompted:
- Choose **Base UI** as the component library (not Radix)
- Keep other settings as defaults or match existing project config
- If it asks about overwriting files, allow it

**Important:** The `--base base` flag does NOT exist. You must use the interactive prompt.

### Step 4: Add All Required Components

```bash
npx shadcn@latest add alert alert-dialog badge breadcrumb button calendar card checkbox command dialog dropdown-menu input label popover radio-group resizable scroll-area select separator sheet sidebar skeleton sonner switch toggle toggle-group tooltip
```

**Note:** The sidebar component IS available in Base UI mode (confirmed via basecn.dev).

### Step 5: Install Base UI Package (if not auto-installed)

```bash
npm install @base-ui-components/react
```

### Step 6: Remove Radix Dependencies

```bash
npm uninstall @radix-ui/react-alert-dialog @radix-ui/react-checkbox @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-label @radix-ui/react-popover @radix-ui/react-radio-group @radix-ui/react-scroll-area @radix-ui/react-select @radix-ui/react-separator @radix-ui/react-slot @radix-ui/react-switch @radix-ui/react-toggle @radix-ui/react-toggle-group @radix-ui/react-tooltip
```

### Step 7: Update PreferencesDialog.tsx

Edit `src/components/preferences/PreferencesDialog.tsx` around line 80.

**Find this pattern:**
```tsx
<SidebarMenuButton asChild isActive={activePane === item.id}>
  <button onClick={() => setActivePane(item.id)} className="w-full">
```

**Replace with:**
```tsx
<SidebarMenuButton
  isActive={activePane === item.id}
  render={<button onClick={() => setActivePane(item.id)} className="w-full" />}
>
```

**Note:** The `asChild` prop becomes `render` prop in Base UI. The children remain inside the component.

### Step 8: Check for Any Remaining asChild Usage

```bash
grep -r "asChild" src/
```

**Expected:** No results outside `src/components/ui/`. If found in consumer code, update using the same `render` prop pattern.

### Step 9: Run Type Checking

```bash
npm run typecheck
```

**If errors occur:** They will likely be related to:
- Missing `render` prop type definitions
- Changed component APIs

Fix each error by consulting the Base UI component API.

### Step 10: Run All Checks

```bash
npm run check:all
```

**Expected:** All checks pass.

### Step 11: Manual Testing Checklist

Start the dev server and test each item:

1. **Preferences Dialog** - Opens via menu or Cmd+,
2. **Sidebar Navigation** - Click each pane (General, Appearance, Advanced)
3. **Select Dropdowns** - Theme select, language select work
4. **Switch Toggles** - All toggle switches work
5. **Command Palette** - Cmd+K opens, search works, items selectable
6. **Tooltips** - Hover states show tooltips
7. **Mobile View** - Resize window, sidebar becomes Sheet

### Step 12: Commit and Report

If all tests pass:
```bash
git add -A
git commit -m "Switch from Radix to Base UI

- Replace all shadcn components with Base UI versions
- Update PreferencesDialog asChild → render pattern
- Remove 15 @radix-ui/* packages
- Add @base-ui-components/react

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

If tests fail: Document which step failed and what error occurred.

---

## Known Issues and Workarounds

From [shadcn-ui/ui#9049](https://github.com/shadcn-ui/ui/issues/9049):

### CSS Selector Changes

If you see styling issues, these selectors have changed:

| Radix Selector | Base UI Selector |
|----------------|------------------|
| `data-[state=open]` | `data-popup-open` or `data-open` |
| `data-[state=closed]` | `data-closed` |
| `data-[state=checked]` | `data-checked` |
| `group-data-[state=open]/collapsible` | `group-data-panel-open` |
| `w-(--radix-dropdown-menu-trigger-width)` | `w-(--anchor-width)` |

### cmdk Library Note

The `cmdk` library internally uses Radix Dialog, BUT our `command.tsx` wraps it with our own Dialog component. This should work fine since the wrapper just passes props through to our (now Base UI) Dialog.

If CommandDialog breaks, the fix is to ensure `cmdk` is not importing its own Radix Dialog.

---

## API Changes Reference

| Radix Pattern | Base UI Pattern |
|--------------|-----------------|
| `asChild` prop | `render` prop |
| `<Slot>` component | `useRender` hook |
| `<Content side="left">` | `<Positioner side="left"><Content>` |

Event handlers remain the same:
- `onValueChange` - same
- `onOpenChange` - same
- `onCheckedChange` - same

---

## Rollback Plan

If migration fails completely:

```bash
git checkout main
git branch -D feature/switch-to-baseui
```

That's it. The main branch is untouched.

---

## Success Criteria

Migration is successful if:
- [ ] `npm run check:all` passes
- [ ] All manual tests in Step 11 pass
- [ ] No visual regressions in UI components
- [ ] Bundle size is same or smaller

---

## Sources

- [shadcn/ui Changelog - Base UI Support](https://ui.shadcn.com/docs/changelog)
- [basecn.dev - Sidebar Component](https://basecn.dev/docs/components/sidebar)
- [GitHub Issue #9049 - asChild removal in Base UI](https://github.com/shadcn-ui/ui/issues/9049)
- [Base UI useRender documentation](https://base-ui.com/react/utils/use-render)
