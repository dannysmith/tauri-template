# Task: Cleanup

We have built a number of features into this template so far. These include:

- Basic Tauri Setup
- Basic AI instructions files (mostly empty)
- Docs directory and tasks system
- Appropriate Tauri Plugins
- ESLint & Prettier
- Tests - Vitest & Rust tests
- Tailwind & ShadCN
- Installed shadcn components and added datepicker and tag input components
- Basic CSS styles for a more native feel and shadcn/tailwind themeing.
- State Management "Onion" with Tanstack Query and Zustand
- Command pattern and Tauri <-> React Bridge
- Main app layout with Theme Provider, MainWindow etc
- Unified title bar and resizable sidebars in main window, which can be hidden
- Preferances dialog system
- Persistance of preferences to disk

## The Task

Before we implement the remaining features of this template, I want to make sure that we haven't overcomplicated anything or introduced any bad practises. The first thing to do is to conduct an extensive review of this codebase and look for high-level opportunities or areas where we are overriding defaults or standard patterns with complex custom code where we don't need to be. Or more specifically where it isn't helpful. Anywhere where we are potentially introducing performance problems. And anywhere where we have added a whole load of like overly complicated or perhaps unnecessary code, bearing in mind this is a template. Now, remember that we don't want to oversimplify this or there's no point having the template in the first place. This should be a perfect starting point for us to develop new applications without having to worry about a whole load of stuff. And also already having certain important workflows and practises well established.

## Cleanup Checklist

### 1. Code Review by System
- [ ] **Tauri Setup & Plugins** - Check all plugins are necessary and properly configured
- [ ] **State Management** - Review Zustand stores for over-engineering
- [ ] **TanStack Query** - Ensure proper usage patterns, no unnecessary complexity
- [ ] **Command System** - Verify command registry isn't over-architected
- [ ] **Component Architecture** - Check React components for unnecessary abstraction
- [ ] **Layout System** - Review MainWindow, sidebars, title bar for simplicity
- [ ] **Preferences System** - Ensure preference handling is straightforward
- [ ] **Styling & Theming** - Check CSS/Tailwind for overcomplicated patterns

### 2. Performance & Best Practices
- [ ] **Bundle Size** - Check for unnecessary dependencies
- [ ] **Re-renders** - Look for performance issues in React components
- [ ] **Memory Leaks** - Check event listeners, subscriptions, cleanup
- [ ] **File Organization** - Ensure clear, logical structure
- [ ] **Type Safety** - Verify TypeScript usage is helpful, not excessive

### 3. Template Appropriateness
- [ ] **Remove Dead Code** - Delete unused components, utilities, types (but keep Shadcn components and likely-to-be-used Tauri plugins)
- [ ] **Simplify Over-Engineering** - Look for patterns that are too complex for a template
- [ ] **Check Dependencies** - Remove any packages that aren't essential (keep common Shadcn components and useful Tauri plugins even if unused)
- [ ] **Default Configurations** - Prefer standard configurations over custom ones
- [ ] **Documentation Gaps** - Note areas that need better explanation

**Note:** Keep all Shadcn UI components and pre-installed Tauri plugins even if not currently used - these are extremely likely to be needed in real applications.

### 4. Quality Gates  
- [ ] **Run `npm run check:all`** - Ensure all quality checks pass
- [ ] **Test Coverage** - Verify existing tests are meaningful
- [ ] **ESLint/Prettier** - Check for any configuration issues
- [ ] **Build Process** - Ensure development and production builds work correctly

## Success Criteria
- Codebase feels clean and well-organized
- No unnecessary complexity for a template
- All existing functionality works as expected
- Good foundation for building real applications
- Clear patterns that are easy to extend
