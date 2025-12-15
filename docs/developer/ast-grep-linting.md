# ast-grep Architectural Linting

## Overview

ast-grep enforces architectural patterns that ESLint cannot detect:

- Directory boundaries (hooks in hooks/, not lib/)
- Structural patterns (no Zustand destructuring)
- Complex rules (getState() pattern)

## Why ast-grep?

- **Fast** - Rust-based, scans in milliseconds
- **Pattern-based** - Matches code structure, not just text
- **Auto-fix capable** - Some rules can auto-fix
- **Machine-readable** - JSON output for AI agents

## Usage

```bash
# Scan for violations
npm run ast:lint

# Auto-fix (where possible)
npm run ast:fix

# Included in check:all
npm run check:all
```

## Available Rules

### 1. no-destructure-zustand (CRITICAL)

**Location:** `.ast-grep/rules/zustand/no-destructure.yml`

```typescript
// BAD - Causes render cascades
const { leftSidebarVisible } = useUIStore()

// GOOD - Only re-renders when this specific value changes
const leftSidebarVisible = useUIStore(state => state.leftSidebarVisible)
```

**Why:** Destructuring subscribes the component to the entire store. Every store update triggers a re-render, even if the destructured values haven't changed.

### 2. hooks-in-hooks-dir

**Location:** `.ast-grep/rules/architecture/hooks-in-hooks-dir.yml`

```typescript
// BAD: lib/utils.ts
export function useMyHook() { }

// GOOD: hooks/use-my-hook.ts
export function useMyHook() { }
```

**Why:** Maintains separation between pure logic and React code. The `lib/` directory should contain only pure business logic and utilities.

### 3. no-store-subscription-in-lib

**Location:** `.ast-grep/rules/architecture/no-store-in-lib.yml`

```typescript
// BAD: In lib/
const value = useUIStore(state => state.value)

// GOOD: In lib/
const value = useUIStore.getState().value
```

**Why:** `lib/` should remain React-independent. Use `getState()` for one-time reads without subscriptions.

## Adding New Rules

### When to Add Rules

Add ast-grep rules when:

- You identify a repeated architectural pattern violation
- ESLint can't express the rule
- The pattern has caused bugs or performance issues

### Rule Structure

```yaml
id: rule-name
message: |
  Brief description with examples.

  BAD: example
  GOOD: example
severity: error # or warning
language: Tsx # or TypeScript
files: # Optional: restrict to paths
  - "src/lib/**/*.ts"
rule:
  pattern: $PATTERN
note: |
  Additional context and doc references.
```

### Pattern Syntax

- `$VAR` - Matches single AST node (named metavariable)
- `$$$ARGS` - Matches zero or more nodes (variadic)
- `$$` - Anonymous match for any nodes

### Testing Patterns

```bash
# Test pattern interactively
npx ast-grep run --pattern 'const { $$$PROPS } = useUIStore($$$ARGS)' src/
```

## Adding New Stores

When you add a new Zustand store, update the no-destructure rule:

1. Edit `.ast-grep/rules/zustand/no-destructure.yml`
2. Add pattern for new store using `any`:

```yaml
rule:
  any:
    - pattern: const { $$$PROPS } = useUIStore($$$ARGS)
    - pattern: const { $$$PROPS } = useNewStore($$$ARGS)
```

## Tool Comparison

| Tool     | Purpose                 | In check:all |
| -------- | ----------------------- | ------------ |
| ESLint   | Syntax, style, TS rules | Yes          |
| ast-grep | Architecture patterns   | Yes          |
| Knip     | Unused code             | No (periodic)|
| jscpd    | Duplicate code          | No (periodic)|

## Troubleshooting

### Rules Not Matching

1. Check the `language` field matches file type (`Tsx` for `.tsx`, `TypeScript` for `.ts`)
2. Test the pattern directly: `npx ast-grep run --pattern 'YOUR_PATTERN' src/`
3. Verify `files` glob patterns if using file restrictions

### False Positives

Add exceptions using the `ignores` field in rules or update the `sgconfig.yml` to exclude specific paths.

## Resources for Writing Rules

### Official Documentation

- **[ast-grep Guide](https://ast-grep.github.io/guide/introduction.html)** - Concepts and tutorials
- **[Pattern Syntax](https://ast-grep.github.io/guide/pattern-syntax.html)** - Detailed pattern matching syntax
- **[Rule Configuration](https://ast-grep.github.io/reference/yaml.html)** - Complete YAML rule reference
- **[Rule Examples](https://ast-grep.github.io/catalog/)** - Catalog of rules for various languages

### Testing Patterns

**For AI agents:** Use the CLI to test patterns against the codebase:

```bash
# Test a pattern and see matches
npx ast-grep run --pattern 'const { $$$PROPS } = useUIStore($$$ARGS)' src/

# Test a rule file directly
npx ast-grep scan -r .ast-grep/rules/zustand/no-destructure.yml
```

**For humans:** Use the [ast-grep Playground](https://ast-grep.github.io/playground.html) to prototype patterns interactively. Paste your code, write a pattern, and see matches highlighted in real-time. The playground also shows the AST structure, which helps understand how code is parsed.

### Workflow for New Rules

1. **Identify the pattern** - Find example code that should (or shouldn't) match
2. **Draft the pattern** - Use metavariables (`$VAR`, `$$$ARGS`) to generalize
3. **Test the pattern** - AI agents: use `npx ast-grep run`. Humans: use the playground
4. **Write the YAML rule** - Add message, severity, and optional file restrictions
5. **Verify against codebase** - Run `npm run ast:lint` to check for false positives

### Key Syntax Reminders

- `$VAR` - Single AST node (e.g., `$NAME` matches an identifier)
- `$$$ARGS` - Zero or more nodes (e.g., function arguments)
- `$$` - Anonymous wildcard
- Language is case-sensitive: `Tsx` for `.tsx`, `TypeScript` for `.ts`
