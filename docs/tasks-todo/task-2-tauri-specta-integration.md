# Add Tauri-Specta for End-to-End Type Safety

## Summary

Integrate [tauri-specta](https://github.com/specta-rs/tauri-specta) to generate TypeScript bindings from Rust commands, providing compile-time type safety across the Tauri IPC boundary.

## Motivation

### Current Pain Points

1. **No type safety** - Commands invoked via string literals with no IDE autocomplete
2. **Manual type duplication** - `src/types/preferences.ts` must be kept in sync with Rust structs manually
3. **Runtime errors** - Typos in command names or argument mismatches only caught at runtime
4. **Breaking changes invisible** - Renaming a Rust command silently breaks frontend

### Benefits of Migration

1. **Compile-time type checking** - TypeScript catches errors before runtime
2. **Auto-generated types** - No manual sync between Rust and TypeScript
3. **IDE autocomplete** - Full IntelliSense for command names, parameters, and return types
4. **Safe refactoring** - Find all usages, rename safely across the stack
5. **Template value** - Establishes pattern for apps built with this template

---

## Scope Analysis

### Rust Backend

| Category      | Count | Location                     |
| ------------- | ----- | ---------------------------- |
| Commands      | 7     | `lib.rs`                     |
| Model structs | 1     | `AppPreferences` in `lib.rs` |

**Commands:**

- `greet` - Simple sync command
- `load_preferences` - Uses `AppHandle`
- `save_preferences` - Uses `AppHandle`
- `send_native_notification` - Uses `AppHandle`
- `save_emergency_data` - Uses `AppHandle`, `serde_json::Value`
- `load_emergency_data` - Uses `AppHandle`, returns `Value`
- `cleanup_old_recovery_files` - Uses `AppHandle`

### Frontend

| Category                | Count | Location                   |
| ----------------------- | ----- | -------------------------- |
| Files using `invoke()`  | 4     | `services/`, `lib/`        |
| Manual type definitions | 1     | `src/types/preferences.ts` |

**Files:**

- `src/services/preferences.ts` - `load_preferences`, `save_preferences`
- `src/lib/recovery.ts` - `save_emergency_data`, `load_emergency_data`, `cleanup_old_recovery_files`
- `src/lib/notifications.ts` - `send_native_notification`
- `src/lib/logger.ts` - Commented out `log_from_frontend`

---

## Known Gotchas and Constraints

### 1. `serde_json::Value` Becomes `unknown` in TypeScript

Commands using `Value` (like `save_emergency_data`) will have `unknown` typed parameters. This is unavoidable but maintains flexibility for dynamic data.

### 2. Six Commands Use `AppHandle`

These require the `tauri` feature on specta:

- `load_preferences`, `save_preferences`
- `send_native_notification`
- `save_emergency_data`, `load_emergency_data`, `cleanup_old_recovery_files`

### 3. Bindings Must Exist Before TypeScript Compilation

We will **commit the bindings file** - simpler CI, reviewable diffs.

---

## Implementation Plan

### Phase 0: Version Verification

Before starting, verify latest compatible versions:

```bash
cargo search tauri-specta
cargo search specta
```

Use exact versions (`=`) during RC phase to prevent breakage.

### Phase 1: Setup and Dependencies

**1.1 Add Rust dependencies**

Update `src-tauri/Cargo.toml`:

```toml
[dependencies]
# Verify versions on crates.io before using!
specta = { version = "=2.0.0-rc.20", features = ["derive", "tauri"] }
tauri-specta = { version = "=2.0.0-rc.21", features = ["typescript"] }
```

**Required features:**

- `derive` - enables `#[derive(Type)]` macro
- `tauri` - required for `AppHandle` support in 6 commands
- `typescript` - generates `.ts` bindings

**1.2 Create bindings generation module**

Create `src-tauri/src/bindings.rs`:

```rust
use tauri_specta::{collect_commands, Builder};

pub fn generate_bindings() -> Builder<tauri::Wry> {
    Builder::<tauri::Wry>::new()
        .commands(collect_commands![
            crate::greet,
            crate::load_preferences,
            crate::save_preferences,
            crate::send_native_notification,
            crate::save_emergency_data,
            crate::load_emergency_data,
            crate::cleanup_old_recovery_files,
        ])
}
```

### Phase 2: Annotate Rust Code

**2.1 Add `specta::Type` to model structs**

```rust
use specta::Type;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AppPreferences {
    pub theme: String,
}
```

**2.2 Add `#[specta::specta]` to all commands**

```rust
#[tauri::command]
#[specta::specta]
pub fn greet(name: &str) -> String {
    format!("Hello, {name}!")
}

#[tauri::command]
#[specta::specta]
pub async fn load_preferences(app: AppHandle) -> Result<AppPreferences, String> {
    // ...
}

// Apply to all 7 commands
```

**2.3 Verify compilation**

```bash
cargo check
```

### Phase 3: Configure Builder

**3.1 Update `lib.rs`**

```rust
mod bindings;

pub fn run() {
    let builder = bindings::generate_bindings();

    // Export bindings - runs on every build to keep file updated
    builder
        .export(
            specta_typescript::Typescript::default()
                .header("// @ts-nocheck\n// Auto-generated by tauri-specta. DO NOT EDIT.\n\n"),
            "../src/lib/bindings.ts",
        )
        .expect("Failed to export TypeScript bindings");

    tauri::Builder::default()
        // ... existing plugins ...
        .invoke_handler(builder.invoke_handler())  // Replace generate_handler!
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

**3.2 Commit the bindings file**

```bash
# Do NOT add to .gitignore
# src/lib/bindings.ts should be committed
```

### Phase 4: Frontend Migration

**4.1 Create bindings wrapper**

Create `src/lib/tauri-bindings.ts`:

```typescript
// Re-export generated bindings with project conventions
export { commands } from './bindings'
export type * from './bindings'
```

**4.2 Update invoke calls**

Replace string-based `invoke()` calls with typed commands:

```typescript
// Before (no type safety)
import { invoke } from '@tauri-apps/api/core'
const prefs = await invoke<AppPreferences>('load_preferences')

// After (full type safety)
import { commands } from '@/lib/tauri-bindings'
const prefs = await commands.loadPreferences()
```

**Files to update:**

- [ ] `src/services/preferences.ts` - `load_preferences`, `save_preferences`
- [ ] `src/lib/recovery.ts` - 3 recovery commands
- [ ] `src/lib/notifications.ts` - `send_native_notification`
- [ ] `src/lib/logger.ts` - Remove or update commented code

**4.3 Remove manual type definitions**

After migration:

- [ ] Delete or deprecate `src/types/preferences.ts`
- [ ] Update imports to use generated types from `@/lib/tauri-bindings`

### Phase 5: Update Tests

**5.1 Update test mocks**

Current test setup mocks `invoke()`. Update to mock the commands object:

```typescript
// Before
vi.mock('@tauri-apps/api/core', () => ({
  invoke: vi.fn(),
}))

// After
vi.mock('@/lib/tauri-bindings', () => ({
  commands: {
    loadPreferences: vi.fn(),
    savePreferences: vi.fn(),
    // ... other commands
  },
}))
```

**Files to check:**

- [ ] `src/App.test.tsx`
- [ ] Any other files mocking `invoke`

### Phase 6: Documentation

**6.1 Update architecture documentation**

- [ ] Update `docs/developer/architecture-guide.md` with tauri-specta section
- [ ] Update command system documentation

**6.2 Create commands guide**

Create `docs/developer/tauri-commands.md` covering:

- How to add new commands with specta
- Generated bindings location and usage
- Testing patterns

**6.3 Update CLAUDE.md**

Note the tauri-specta pattern in the Technology Stack section.

---

## Files Requiring Attention

### Rust

| File                        | Action                                        |
| --------------------------- | --------------------------------------------- |
| `src-tauri/Cargo.toml`      | Add specta dependencies                       |
| `src-tauri/src/lib.rs`      | Add Type derive, specta macro, update builder |
| `src-tauri/src/bindings.rs` | **CREATE**                                    |

### Frontend

| File                          | Action                          |
| ----------------------------- | ------------------------------- |
| `src/lib/bindings.ts`         | **GENERATED** - commit this     |
| `src/lib/tauri-bindings.ts`   | **CREATE** - wrapper            |
| `src/services/preferences.ts` | Update to use typed commands    |
| `src/lib/recovery.ts`         | Update to use typed commands    |
| `src/lib/notifications.ts`    | Update to use typed commands    |
| `src/lib/logger.ts`           | Update or remove commented code |
| `src/types/preferences.ts`    | Delete or deprecate             |

### Tests

| File               | Action       |
| ------------------ | ------------ |
| `src/App.test.tsx` | Update mocks |

### Documentation

| File                                   | Action             |
| -------------------------------------- | ------------------ |
| `docs/developer/tauri-commands.md`     | **CREATE**         |
| `docs/developer/architecture-guide.md` | Add specta section |

---

## Verification Checklist

After each phase:

- [ ] `cargo check` passes
- [ ] `pnpm run check:all` passes
- [ ] Generated bindings file exists and is valid TypeScript
- [ ] IDE autocomplete works for commands
- [ ] All existing functionality works correctly

---

## Post-Migration: Adding New Commands

After migration, follow this workflow for new commands:

### 1. Define command in Rust

```rust
#[tauri::command]
#[specta::specta]
pub async fn my_new_command(arg: String) -> Result<MyType, String> {
    // implementation
}
```

### 2. Add to bindings.rs

```rust
.commands(collect_commands![
    // ... existing
    crate::my_new_command,
])
```

### 3. Add Type derive to any new structs

```rust
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct MyType {
    // ...
}
```

### 4. Regenerate bindings

```bash
cargo build  # bindings.ts updates automatically
```

### 5. Use in frontend

```typescript
import { commands } from '@/lib/tauri-bindings'
const result = await commands.myNewCommand('arg')
```

### 6. Commit both Rust changes and bindings.ts

---

## Future Enhancement: Typed Events

tauri-specta also supports typed events. Consider adding in a follow-up task:

```rust
use tauri_specta::collect_events;

Builder::<tauri::Wry>::new()
    .commands(collect_commands![...])
    .events(collect_events![
        SomeEvent,
    ])
```

---

## Risks and Mitigations

| Risk                         | Mitigation                                      |
| ---------------------------- | ----------------------------------------------- |
| RC version instability       | Lock exact versions (`=`), test before updating |
| `serde_json::Value` handling | Accept `unknown` type, document pattern         |
| Test mock updates            | Simple scope - only a few files to update       |

---

## Success Criteria

1. All 7 commands have TypeScript bindings generated
2. All 4 files using `invoke()` migrated to typed commands
3. No manual type duplication between Rust and TypeScript
4. `pnpm run check:all` passes
5. IDE provides full autocomplete for Tauri commands
6. Documentation updated with new command workflow
7. Pattern established for template users

---

## References

- [tauri-specta GitHub](https://github.com/specta-rs/tauri-specta)
- [Specta documentation](https://specta.dev/docs/tauri-specta/v2)
- [crates.io/tauri-specta](https://crates.io/crates/tauri-specta)
