# Writing ast-grep Rules

Reference for creating custom ast-grep rules. Intended for AI agents but readable by humans.

## When to Add Rules

Add ast-grep rules when:

- You identify a repeated architectural violation
- ESLint can't express the rule (pattern-based matching needed)
- The pattern has caused bugs or performance issues

## Rule Structure

```yaml
id: rule-name
message: |
  Brief description with examples.

  BAD: example
  GOOD: example
severity: error # or warning
language: Tsx # or TypeScript
files: # Optional: restrict to paths
  - 'src/lib/**/*.ts'
rule:
  pattern: $PATTERN
note: |
  Additional context for developers.
```

## Pattern Syntax

| Syntax    | Meaning            | Example                    |
| --------- | ------------------ | -------------------------- |
| `$VAR`    | Single AST node    | `const $NAME = useStore()` |
| `$$$ARGS` | Zero or more nodes | `function($$$ARGS)`        |
| `$$`      | Anonymous wildcard | `{ $$, field: $VALUE }`    |

## Testing Patterns

Test a pattern against the codebase:

```bash
npx ast-grep run --pattern 'const { $$$PROPS } = useUIStore($$$ARGS)' src/
```

Test a rule file:

```bash
npx ast-grep scan -r .ast-grep/rules/zustand/no-destructure.yml
```

## Example: No Zustand Destructuring

**File:** `.ast-grep/rules/zustand/no-destructure.yml`

```yaml
id: no-destructure-zustand
message: |
  Don't destructure Zustand stores - use selectors instead.

  BAD: const { visible } = useUIStore()
  GOOD: const visible = useUIStore(state => state.visible)
severity: error
language: Tsx
rule:
  any:
    - pattern: const { $$$PROPS } = useUIStore($$$ARGS)
    - pattern: const { $$$PROPS } = usePreferencesStore($$$ARGS)
note: |
  Destructuring subscribes to the entire store, causing unnecessary re-renders.
  See docs/developer/state-management.md for details.
```

## Adding New Stores to Existing Rules

When you add a new Zustand store, update the no-destructure rule:

```yaml
rule:
  any:
    - pattern: const { $$$PROPS } = useUIStore($$$ARGS)
    - pattern: const { $$$PROPS } = useNewStore($$$ARGS) # Add new store
```

## Common Patterns

### Catching hook calls outside hooks directory

```yaml
id: hooks-in-hooks-dir
language: TypeScript
files:
  - 'src/lib/**/*.ts'
rule:
  pattern: export function use$NAME($$$ARGS)
```

### Catching store subscriptions in lib/

```yaml
id: no-store-in-lib
language: TypeScript
files:
  - 'src/lib/**/*.ts'
rule:
  pattern: const $VAR = $STORE(state => $$$SELECTOR)
```

## Debugging

**Rules not matching:**

1. Check `language` matches file type (`Tsx` for `.tsx`, `TypeScript` for `.ts`)
2. Test pattern directly with `npx ast-grep run`
3. Verify `files` globs if using path restrictions

**False positives:**

- Add exceptions using `ignores` in rules
- Update `sgconfig.yml` to exclude paths

## Resources

- [Pattern Syntax](https://ast-grep.github.io/guide/pattern-syntax.html)
- [Rule Configuration](https://ast-grep.github.io/reference/yaml.html)
- [Rule Catalog](https://ast-grep.github.io/catalog/)
