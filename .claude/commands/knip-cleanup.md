---
allowed-tools: [Read, Bash, Glob, Grep, Edit, Write, AskUserQuestion]
description: 'Run knip and intelligently clean up unused code and dependencies'
---

# /knip-cleanup - Intelligent Knip Cleanup

## Purpose

Run knip to find unused files, dependencies, and exports, then intelligently clean up while preserving:

- shadcn/ui components (future use)
- Radix dependencies used by shadcn components
- Barrel exports (intentionally export everything)
- Tauri-called exports

## Execution Steps

### 1. Run Knip

```bash
npm run knip
```

Capture and parse the output.

### 2. Analyze shadcn/ui Components

Check which shadcn/ui components exist:

```bash
ls src/components/ui/
```

Build mapping of Radix packages used by shadcn components:

```bash
grep -r "from '@radix-ui" src/components/ui/*.tsx 2>/dev/null || echo "No Radix imports found"
```

### 3. Categorize Items

**KEEP (DO NOT REMOVE):**

- All files in `src/components/ui/` (shadcn - future use)
- Radix dependencies used by ANY shadcn component
- All barrel exports (`index.ts` files)
- Tauri-related dependencies (`@tauri-apps/*`)
- Core dependencies: `zod`, `react-hook-form`, `@hookform/resolvers`, `date-fns`

**SAFE TO AUTO-REMOVE:**

- Unused non-shadcn files with no imports anywhere
- Dependencies with zero usage
- Unused devDependencies for tools not configured

**NEEDS USER REVIEW:**

- Files that might be planned features
- Ambiguous dependency usage
- Type exports (might be external API)

### 4. Auto-Remove Safe Items

For safe items:

```bash
# Unused dependencies
npm uninstall <package-name>

# Unused files
rm -f <file-path>
```

### 5. Present Review Items

For items needing review, provide context and use AskUserQuestion:

```typescript
{
  questions: [{
    question: "Should we remove the unused 'example-module.ts' file?",
    header: "Remove?",
    multiSelect: false,
    options: [
      { label: "Yes, remove", description: "File has no imports anywhere" },
      { label: "Keep", description: "I plan to use this" }
    ]
  }]
}
```

### 6. Output Format

```markdown
# Knip Cleanup Summary

## Auto-Removed (X items)

- [file/package] - reason

## Kept (X items)

- [file/package] - reason (shadcn/Radix/barrel/etc.)

## Needs Your Review (X items)

### [Item Name]

- Type: [file/dependency/export]
- Context: [why might still be needed]
- Recommendation: [remove/keep with confidence]
```

### 7. After Cleanup

```bash
npm run check:all
```

## Important Notes

- **NEVER auto-remove** anything questionable - ask user
- Better to keep unused code than break the app
- This runs periodically, conservative now = aggressive later
