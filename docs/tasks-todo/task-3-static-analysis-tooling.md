# Static Analysis Tooling

## Summary

Add comprehensive static analysis tooling to catch issues early and enforce architectural patterns:

1. **React Compiler** - Automatic memoization, catches hook rule violations
2. **Knip** - Detects unused files, dependencies, and exports
3. **jscpd** - Finds copy-pasted/duplicated code
4. **ast-grep** - Enforces architectural patterns ESLint can't detect

## Motivation

### Why These Tools?

| Tool | Purpose | When to Run |
|------|---------|-------------|
| **React Compiler** | Auto-memoize, catch hook issues | Always (build-time) |
| **Knip** | Find unused code/deps | Periodically (refactoring) |
| **jscpd** | Find duplicate code | Periodically (refactoring) |
| **ast-grep** | Enforce architecture patterns | Always (in check:all) |

### Template Value

This establishes patterns for apps built with this template:
- React Compiler eliminates manual `useMemo`/`useCallback` optimization
- Knip prevents dependency bloat over time
- jscpd catches copy-paste debt before it accumulates
- ast-grep enforces architecture rules that ESLint can't express

---

## Phase 1: React Compiler

**Goal:** Enable React Compiler for automatic memoization and hook validation.

**Current State:**
- React 19 (compatible)
- Vite with `@vitejs/plugin-react`
- No babel configuration currently

### Tasks

1. **Install React Compiler**
   - [ ] Install `babel-plugin-react-compiler` as devDependency

2. **Configure Vite**
   - [ ] Update `vite.config.ts` to add babel plugin to react() config

3. **Verify Setup**
   - [ ] Build project successfully
   - [ ] Check React DevTools for "Memo ✨" badge on components

### Implementation

**Install:**
```bash
pnpm add -D babel-plugin-react-compiler@latest
```

**Update vite.config.ts:**
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'

const host = process.env.TAURI_DEV_HOST

export default defineConfig(async () => ({
  plugins: [
    react({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // ... rest of config unchanged
}))
```

**Note:** React Compiler must run FIRST in the babel pipeline. Since it's the only plugin, this is automatic.

### Acceptance Criteria

- [ ] `pnpm run build` completes successfully
- [ ] No new TypeScript/lint errors
- [ ] React DevTools shows optimized components

---

## Phase 2: Knip Integration

**Goal:** Add knip for detecting unused code and dependencies.

### Tasks

1. **Install Knip**
   - [ ] Install `knip` as devDependency

2. **Create Configuration**
   - [ ] Create `knip.json` with appropriate settings

3. **Add npm Script**
   - [ ] Add `knip` script to package.json

4. **Create Claude Code Command**
   - [ ] Create `.claude/commands/knip-cleanup.md`

### Implementation

**Install:**
```bash
pnpm add -D knip
```

**Create knip.json:**
```json
{
  "$schema": "https://unpkg.com/knip@5/schema.json",
  "entry": ["src/main.tsx"],
  "project": ["src/**/*.{ts,tsx}"],
  "ignore": [
    "src/components/ui/**",
    "src/test/**"
  ],
  "ignoreDependencies": [
    "@tauri-apps/*",
    "@radix-ui/*"
  ],
  "ignoreExportsUsedInFile": true
}
```

**Add to package.json:**
```json
{
  "scripts": {
    "knip": "knip"
  }
}
```

### Claude Code Command

Create `.claude/commands/knip-cleanup.md`:

```markdown
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

\`\`\`bash
pnpm run knip
\`\`\`

Capture and parse the output.

### 2. Analyze shadcn/ui Components

Check which shadcn/ui components exist:

\`\`\`bash
ls src/components/ui/
\`\`\`

Build mapping of Radix packages used by shadcn components:

\`\`\`bash
grep -r "from '@radix-ui" src/components/ui/*.tsx 2>/dev/null || echo "No Radix imports found"
\`\`\`

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

\`\`\`bash
# Unused dependencies
pnpm remove <package-name>

# Unused files
rm -f <file-path>
\`\`\`

### 5. Present Review Items

For items needing review, provide context and use AskUserQuestion:

\`\`\`typescript
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
\`\`\`

### 6. Output Format

\`\`\`markdown
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
\`\`\`

### 7. After Cleanup

\`\`\`bash
pnpm run check:all
\`\`\`

## Important Notes

- **NEVER auto-remove** anything questionable - ask user
- Better to keep unused code than break the app
- This runs periodically, conservative now = aggressive later
```

### Acceptance Criteria

- [ ] `pnpm run knip` runs successfully
- [ ] `/knip-cleanup` command created and works
- [ ] Configuration ignores appropriate files

---

## Phase 3: jscpd Integration

**Goal:** Add jscpd for detecting code duplication.

### Tasks

1. **Install jscpd**
   - [ ] Install `jscpd` as devDependency

2. **Create Configuration**
   - [ ] Create `.jscpd.json` with appropriate settings

3. **Add npm Script**
   - [ ] Add `jscpd` script to package.json

4. **Create Claude Code Command**
   - [ ] Create `.claude/commands/review-duplicates.md`

### Implementation

**Install:**
```bash
pnpm add -D jscpd
```

**Create .jscpd.json:**
```json
{
  "threshold": 0,
  "reporters": ["json", "console"],
  "output": "jscpd-report",
  "pattern": "**/*.{ts,tsx,rs}",
  "ignore": [
    "**/node_modules/**",
    "**/target/**",
    "**/dist/**",
    "**/*.test.{ts,tsx}",
    "**/*.spec.{ts,tsx}",
    "**/test/**",
    "src/components/ui/**"
  ],
  "minLines": 10,
  "minTokens": 50,
  "gitignore": true
}
```

**Add to package.json:**
```json
{
  "scripts": {
    "jscpd": "jscpd"
  }
}
```

**Add to .gitignore:**
```
jscpd-report/
```

### Claude Code Command

Create `.claude/commands/review-duplicates.md`:

```markdown
---
allowed-tools: [Read, Bash, Grep, AskUserQuestion, Edit, Write]
description: 'Find and intelligently review duplicated code using jscpd'
---

# /review-duplicates - Intelligent Duplicate Code Review

## Purpose

Use jscpd to find duplicated code, then categorize and present for manual review.

**Philosophy**: Duplicate code analysis is contextual. This provides categorization and recommendations, but ALL refactoring is manual and user-approved.

## Execution Steps

### 1. Run jscpd

\`\`\`bash
pnpm run jscpd
\`\`\`

### 2. Parse Results

\`\`\`bash
cat jscpd-report/jscpd-report.json
\`\`\`

### 3. Categorize Each Duplicate

**By Type:**
- **Business Logic** - Algorithms, data processing (high priority)
- **Component Patterns** - React patterns (might be intentional)
- **Utility Functions** - Helpers (medium priority)
- **Type Definitions** - Interfaces (often intentional)
- **Setup/Config** - Initialization (low priority)

**By Risk:**
- **High** (>15 lines business logic, complex conditionals)
- **Medium** (10-15 lines utilities, transformations)
- **Low** (<10 lines, patterns, boilerplate)

### 4. Present Findings

\`\`\`markdown
# Duplicate Code Review

Found X duplicates across Y files

## High Priority - Business Logic
### Duplicate #1: [Name]
- **Type**: Business Logic
- **Risk**: High
- **Lines**: X lines (Y tokens)
- **Locations**:
  - \`path/file1.ts:10-25\`
  - \`path/file2.ts:30-45\`
- **Code Preview**: [snippet]
- **Recommendation**: Extract to shared function
- **Confidence**: X%

## Low Priority - Likely Intentional
### Duplicate #N: [Name]
- **Analysis**: Intentional pattern for [reason]
- **Recommendation**: Keep as-is
\`\`\`

### 5. Interactive Review

For High/Medium risk, use AskUserQuestion:

\`\`\`typescript
{
  questions: [{
    question: "Should we refactor this duplicate?",
    header: "Refactor?",
    options: [
      { label: "Yes, extract now", description: "Create shared function" },
      { label: "Keep as-is", description: "Intentional duplication" }
    ]
  }]
}
\`\`\`

### 6. Refactor If Approved

1. Read both locations for full context
2. Design extraction (name, params, location)
3. Present plan for approval
4. Execute refactoring
5. Run `pnpm run check:all`

### 7. Cleanup

\`\`\`bash
rm -rf jscpd-report
\`\`\`

## When to Keep Duplicates

- shadcn/ui patterns (consistency)
- Test setup (isolation)
- Type definitions (decoupling)
- <10 lines simple patterns
- Rust error handling idioms

## When to Extract

- Business logic >15 lines
- Appears 3+ locations
- Complex algorithms
- Data transformation pipelines
```

### Acceptance Criteria

- [ ] `pnpm run jscpd` runs and produces report
- [ ] `/review-duplicates` command created and works
- [ ] jscpd-report/ added to .gitignore

---

## Phase 4: ast-grep Integration

**Goal:** Add ast-grep for architectural pattern enforcement.

**Why ast-grep?**
- ESLint can't enforce directory boundaries or structural patterns
- Extremely fast (Rust-based)
- Machine-readable output for AI agents
- Self-documenting architecture rules

### Tasks

1. **Install ast-grep**
   - [ ] Install `@ast-grep/cli` as devDependency

2. **Create Configuration**
   - [ ] Create `sgconfig.yml`
   - [ ] Create `.ast-grep/rules/` directory with initial rules

3. **Add npm Scripts**
   - [ ] Add `ast:lint` and `ast:fix` scripts
   - [ ] Add to `check:all` pipeline

4. **Document Patterns**
   - [ ] Create documentation for adding new rules

### Implementation

**Install:**
```bash
pnpm add -D @ast-grep/cli
```

**Create sgconfig.yml:**
```yaml
ruleDirs:
  - ./.ast-grep/rules

languageGlobs:
  typescript:
    - "src/**/*.ts"
    - "src/**/*.tsx"

testConfigs:
  - testDir: ./.ast-grep/test

output:
  style: rich
  color: auto
```

**Add to package.json:**
```json
{
  "scripts": {
    "ast:lint": "ast-grep scan",
    "ast:fix": "ast-grep scan --fix",
    "check:all": "npm run typecheck && npm run lint && npm run ast:lint && npm run format:check && npm run rust:fmt:check && npm run rust:clippy && npm run test:run && npm run rust:test"
  }
}
```

### Initial Rules

**Rule 1: No Zustand Store Destructuring**

Create `.ast-grep/rules/zustand/no-destructure.yml`:

```yaml
id: no-destructure-zustand
message: |
  Never destructure from Zustand stores. Use selector syntax instead.

  ❌ BAD: const { leftSidebarVisible } = useUIStore()
  ✅ GOOD: const leftSidebarVisible = useUIStore(state => state.leftSidebarVisible)

  For multiple values, use multiple selectors or useShallow.
severity: error
language: typescript
rule:
  any:
    - pattern: const { $$PROPS } = useUIStore($$)
note: |
  Destructuring causes render cascades - every store update triggers re-renders
  even if destructured values haven't changed.

  See: docs/developer/architecture-guide.md (Performance Patterns)
url: https://github.com/pmndrs/zustand#selecting-multiple-state-slices
```

**Rule 2: Hooks in hooks/ Directory**

Create `.ast-grep/rules/architecture/hooks-in-hooks-dir.yml`:

```yaml
id: hooks-in-hooks-dir
message: |
  React hooks (functions starting with 'use') must be in hooks/ or services/, not lib/.

  ❌ BAD: lib/some-file.ts exporting useSomething()
  ✅ GOOD: hooks/use-something.ts or services/something.ts

  The lib/ directory is for pure business logic and utilities.
severity: error
language: typescript
files:
  - "src/lib/**/*.ts"
  - "src/lib/**/*.tsx"
rule:
  pattern: export function $HOOK($$) { $$ }
  kind: function_declaration
constraints:
  HOOK:
    regex: ^use[A-Z]\w+$
note: |
  Enforces directory boundaries:
  - lib/: Pure business logic, utilities (no React hooks)
  - hooks/: React hooks
  - services/: TanStack Query hooks for data fetching

  Exception: Theme context provider can live in lib/.
```

**Rule 3: No Store Subscriptions in lib/**

Create `.ast-grep/rules/architecture/no-store-in-lib.yml`:

```yaml
id: no-store-subscription-in-lib
message: |
  lib/ modules should use getState() for store access, not subscriptions.

  ❌ BAD: const value = useUIStore(state => state.value)
  ✅ GOOD: const value = useUIStore.getState().value

  Store subscriptions create React coupling. lib/ should remain pure.
severity: error
language: typescript
files:
  - "src/lib/**/*.ts"
  - "src/lib/**/*.tsx"
rule:
  pattern: useUIStore($$)
note: |
  lib/ can import stores ONLY for getState() - one-way data access
  without React coupling.

  See: docs/developer/architecture-guide.md
```

### Directory Structure

```
.ast-grep/
├── rules/
│   ├── zustand/
│   │   └── no-destructure.yml
│   └── architecture/
│       ├── hooks-in-hooks-dir.yml
│       └── no-store-in-lib.yml
└── test/
    └── (optional test files)

sgconfig.yml
```

### Acceptance Criteria

- [ ] `pnpm run ast:lint` runs successfully
- [ ] Rules catch violations correctly
- [ ] Added to `check:all` pipeline
- [ ] No false positives on current codebase

---

## Phase 5: Documentation

**Goal:** Document the static analysis tooling for template users.

### Tasks

1. **Create ast-grep Documentation**
   - [ ] Create `docs/developer/ast-grep-linting.md`
   - [ ] Document existing rules
   - [ ] Guide for adding new rules

2. **Update Architecture Guide**
   - [ ] Add section on static analysis tools
   - [ ] Reference ast-grep rules

3. **Update check:all Documentation**
   - [ ] Document what each tool checks
   - [ ] When to use each tool

### ast-grep Documentation

Create `docs/developer/ast-grep-linting.md`:

```markdown
# ast-grep Architectural Linting

## Overview

ast-grep enforces architectural patterns that ESLint cannot detect:
- Directory boundaries (hooks in hooks/, not lib/)
- Structural patterns (no Zustand destructuring)
- Complex rules (getState() pattern)

## Why ast-grep?

- **Fast** - Rust-based, scans in milliseconds
- **Pattern-based** - Matches code structure
- **Auto-fix capable** - Some rules can auto-fix
- **Machine-readable** - JSON output for AI agents

## Usage

\`\`\`bash
# Scan for violations
pnpm run ast:lint

# Auto-fix (where possible)
pnpm run ast:fix

# Included in check:all
pnpm run check:all
\`\`\`

## Available Rules

### 1. no-destructure-zustand (CRITICAL)

\`\`\`typescript
// ❌ BAD
const { leftSidebarVisible } = useUIStore()

// ✅ GOOD
const leftSidebarVisible = useUIStore(state => state.leftSidebarVisible)
\`\`\`

**Why:** Destructuring causes render cascades.

### 2. hooks-in-hooks-dir

\`\`\`typescript
// ❌ BAD: lib/utils.ts
export function useMyHook() { }

// ✅ GOOD: hooks/use-my-hook.ts
export function useMyHook() { }
\`\`\`

**Why:** Maintains separation between pure logic and React code.

### 3. no-store-subscription-in-lib

\`\`\`typescript
// ❌ BAD: In lib/
const value = useUIStore(state => state.value)

// ✅ GOOD: In lib/
const value = useUIStore.getState().value
\`\`\`

**Why:** lib/ should remain React-independent.

## Adding New Rules

### When to Add Rules

Add ast-grep rules when:
- You identify a repeated architectural pattern
- ESLint can't express the rule
- The pattern has caused bugs or issues

### Rule Structure

\`\`\`yaml
id: rule-name
message: |
  Brief description with examples.

  ❌ BAD: example
  ✅ GOOD: example
severity: error  # or warning
language: typescript
files:  # Optional: restrict to paths
  - "src/lib/**/*.ts"
rule:
  pattern: $PATTERN
note: |
  Additional context and doc references.
\`\`\`

### Pattern Syntax

- `$VAR` - Matches single AST node
- `$$` - Matches zero or more nodes
- `$$ARGS` - Matches argument list

### Testing Rules

\`\`\`bash
# Test pattern interactively
npx ast-grep run -p 'const { $$PROPS } = useUIStore($$)'
\`\`\`

## Adding New Stores

When you add a new Zustand store, update the rules:

1. Edit `.ast-grep/rules/zustand/no-destructure.yml`
2. Add pattern for new store:
   \`\`\`yaml
   rule:
     any:
       - pattern: const { $$PROPS } = useUIStore($$)
       - pattern: const { $$PROPS } = useNewStore($$)  # Add this
   \`\`\`

## Tool Comparison

| Tool | Purpose | In check:all |
|------|---------|--------------|
| ESLint | Syntax, style, TS rules | Yes |
| ast-grep | Architecture patterns | Yes |
| Knip | Unused code | No (periodic) |
| jscpd | Duplicate code | No (periodic) |
```

### Acceptance Criteria

- [ ] `docs/developer/ast-grep-linting.md` created
- [ ] Architecture guide updated
- [ ] Pattern for adding new rules documented

---

## Phase 6: Final Integration

### Tasks

1. **Verify All Tools Work Together**
   - [ ] Run `pnpm run check:all` with all new tools
   - [ ] Fix any issues in current codebase

2. **Update CLAUDE.md**
   - [ ] Note React Compiler usage
   - [ ] Reference ast-grep for architecture enforcement

3. **Clean Up**
   - [ ] Ensure no lint/type errors
   - [ ] All acceptance criteria met

### Acceptance Criteria

- [ ] `pnpm run check:all` passes with all tools
- [ ] React Compiler active
- [ ] ast-grep rules enforced
- [ ] Knip and jscpd available for periodic use
- [ ] Claude Code commands work

---

## Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `.jscpd.json` | jscpd configuration |
| `knip.json` | Knip configuration |
| `sgconfig.yml` | ast-grep configuration |
| `.ast-grep/rules/zustand/no-destructure.yml` | Zustand rule |
| `.ast-grep/rules/architecture/hooks-in-hooks-dir.yml` | Hooks rule |
| `.ast-grep/rules/architecture/no-store-in-lib.yml` | Store rule |
| `.claude/commands/knip-cleanup.md` | Knip command |
| `.claude/commands/review-duplicates.md` | jscpd command |
| `docs/developer/ast-grep-linting.md` | Documentation |

### Modified Files

| File | Changes |
|------|---------|
| `vite.config.ts` | Add React Compiler babel plugin |
| `package.json` | Add scripts and devDependencies |
| `.gitignore` | Add jscpd-report/ |
| `docs/developer/architecture-guide.md` | Reference static analysis |
| `CLAUDE.md` | Note React Compiler, ast-grep |

---

## Success Criteria

1. React Compiler active and optimizing components
2. `pnpm run ast:lint` catches architecture violations
3. `pnpm run knip` identifies unused code
4. `pnpm run jscpd` finds duplicated code
5. Claude Code commands work for intelligent cleanup
6. All tools documented for template users
7. `pnpm run check:all` includes ast-grep

---

## References

- [React Compiler Installation](https://react.dev/learn/react-compiler/installation)
- [ast-grep Documentation](https://ast-grep.github.io/)
- [Knip Documentation](https://knip.dev/)
- [jscpd Documentation](https://github.com/kucherenko/jscpd)
