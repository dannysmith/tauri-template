# Error Handling

Patterns for consistent error handling across Rust and TypeScript.

## Error Propagation Flow

```
Rust Command (Result<T, E>) → tauri-specta → TypeScript discriminated union → TanStack Query/UI
```

Rust `Result<T, E>` types become TypeScript discriminated unions:

```typescript
type Result<T, E> = { status: 'ok'; data: T } | { status: 'error'; error: E }
```

## Rust Error Types

### Simple Commands

For commands with one failure mode, use `String` errors:

```rust
#[tauri::command]
#[specta::specta]
pub async fn simple_operation() -> Result<Data, String> {
    do_work().map_err(|e| format!("Operation failed: {e}"))
}
```

### Production Commands

For commands with multiple failure modes, use structured error enums:

```rust
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "type")]  // Creates TypeScript discriminated union
pub enum MyError {
    NotFound,
    ValidationError { message: String },
    IoError { message: String },
}

impl std::fmt::Display for MyError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            MyError::NotFound => write!(f, "Not found"),
            MyError::ValidationError { message } => write!(f, "{message}"),
            MyError::IoError { message } => write!(f, "IO error: {message}"),
        }
    }
}

#[tauri::command]
#[specta::specta]
pub async fn production_operation() -> Result<Data, MyError> {
    // ...
}
```

TypeScript receives:

```typescript
type MyError =
  | { type: 'NotFound' }
  | { type: 'ValidationError'; message: string }
  | { type: 'IoError'; message: string }
```

## TypeScript Error Handling

### Pattern 1: Explicit Handling (Event Handlers)

```typescript
// ✅ GOOD: Handle errors inline with user feedback
const handleSave = async () => {
  const result = await commands.saveData(data)
  if (result.status === 'error') {
    toast.error('Save failed', { description: result.error })
    return
  }
  toast.success('Saved!')
}
```

### Pattern 2: unwrapResult (TanStack Query)

```typescript
// ✅ GOOD: Let TanStack Query handle errors
const { data, error } = useQuery({
  queryKey: ['data'],
  queryFn: async () => unwrapResult(await commands.loadData()),
})
```

### Pattern 3: Graceful Degradation

```typescript
// ✅ GOOD: Fall back to defaults on error
const { data } = useQuery({
  queryKey: ['preferences'],
  queryFn: async () => {
    const result = await commands.loadPreferences()
    if (result.status === 'error') {
      logger.warn('Failed to load preferences, using defaults')
      return defaultPreferences
    }
    return result.data
  },
})
```

## User-Facing vs Technical Errors

### Rust: Log Technical Details, Return User Messages

```rust
// ✅ GOOD: Log technical details, return user-friendly message
pub async fn load_file(path: &str) -> Result<String, String> {
    log::debug!("Loading file: {path}");

    std::fs::read_to_string(path).map_err(|e| {
        log::error!("Failed to read file {path}: {e}");  // Technical log
        format!("Could not read file")                   // User message
    })
}
```

### TypeScript: Toast for Users, Logger for Debugging

```typescript
// ✅ GOOD: Separate user feedback from technical logging
const result = await commands.saveData(data)
if (result.status === 'error') {
  logger.error('Save failed', { error: result.error, data }) // Technical
  toast.error('Failed to save') // User-facing
}
```

## Retry Configuration

Configure TanStack Query retry behavior based on error type:

```typescript
// ✅ GOOD: Smart retry logic
const { data } = useQuery({
  queryKey: ['data'],
  queryFn: loadData,
  retry: (failureCount, error) => {
    // Don't retry client errors (4xx)
    if (error.message.includes('API error: 4')) return false
    // Retry network/server errors up to 3 times
    return failureCount < 3
  },
})
```

Default retry settings in `query-client.ts`:

| Query Type | Retries | Rationale                            |
| ---------- | ------- | ------------------------------------ |
| Queries    | 1       | Transient failures may recover       |
| Mutations  | 1       | Avoid duplicate writes on slow saves |

## Global Error Toasts

Avoid per-query error toasts (causes duplicates). Use global handling:

```typescript
// ✅ GOOD: Centralized in query-client.ts
const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      if (query.meta?.errorToast !== false) {
        toast.error('Something went wrong')
      }
    },
  }),
})

// Opt out for specific queries
useQuery({
  queryKey: ['optional-feature'],
  queryFn: loadOptional,
  meta: { errorToast: false },
})
```

## React Error Boundaries

Error boundaries catch render errors, not async errors:

| Caught by Error Boundary    | NOT Caught                          |
| --------------------------- | ----------------------------------- |
| Errors during render        | Errors in event handlers            |
| Errors in lifecycle methods | Async code (promises)               |
| Errors in constructors      | Errors in the error boundary itself |

For async Tauri command errors, use explicit handling or `unwrapResult` with TanStack Query.

## Rollback Pattern

For multi-step operations, rollback on failure:

```typescript
// ✅ GOOD: Rollback on failure
const handleChange = async (newValue: string) => {
  const oldValue = currentValue

  // Step 1: Update backend
  const result = await commands.updateValue(newValue)
  if (result.status === 'error') {
    toast.error('Update failed')
    return
  }

  // Step 2: Persist
  try {
    await savePreferences.mutateAsync({ ...prefs, value: newValue })
  } catch {
    // Rollback step 1
    await commands.updateValue(oldValue)
    toast.error('Save failed, changes reverted')
  }
}
```

## Quick Reference

| Scenario               | Rust Error Type | TypeScript Pattern   | User Feedback    |
| ---------------------- | --------------- | -------------------- | ---------------- |
| Simple command         | `String`        | if/else + toast      | Toast on error   |
| Multiple failure modes | Structured enum | Match on `.type`     | Context-specific |
| Data fetching          | Either          | `unwrapResult`       | Query error UI   |
| Optional feature       | Either          | Graceful degradation | Silent fallback  |
| Critical operation     | Structured enum | Explicit + rollback  | Toast + recovery |

See also: [tauri-commands.md](./tauri-commands.md) for Result type patterns, [logging.md](./logging.md) for logging best practices.
