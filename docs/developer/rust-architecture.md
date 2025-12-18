# Rust Architecture

Module organization and patterns for the Tauri backend.

## Module Structure

```
src-tauri/src/
├── main.rs          # Entry point (just calls lib::run())
├── lib.rs           # App setup, plugins, startup logic
├── bindings.rs      # tauri-specta command registration
├── types.rs         # Shared types, constants, validation
├── commands/        # Command handlers by domain
│   ├── mod.rs       # Re-exports all command modules
│   ├── preferences.rs
│   ├── notifications.rs
│   ├── quick_pane.rs
│   └── recovery.rs
└── utils/           # Utility modules
    ├── mod.rs
    └── platform.rs  # Platform-specific helpers
```

## Adding New Commands

### 1. Create or update a command module

```rust
// src-tauri/src/commands/my_feature.rs
use tauri::AppHandle;

/// Brief description of what this command does.
#[tauri::command]
#[specta::specta]
pub fn my_command(app: AppHandle, input: String) -> Result<String, String> {
    // Implementation
    Ok(format!("Processed: {input}"))
}
```

### 2. Export from commands/mod.rs

```rust
pub mod my_feature;
```

### 3. Register in bindings.rs

```rust
pub fn generate_bindings() -> Builder<tauri::Wry> {
    use crate::commands::{my_feature, /* ... */};

    Builder::<tauri::Wry>::new().commands(collect_commands![
        my_feature::my_command,
        // ... other commands
    ])
}
```

### 4. Regenerate TypeScript bindings

```bash
npm run rust:bindings
```

## Type Patterns

### Shared Types (types.rs)

Types shared between commands go in `types.rs`:

```rust
use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct MyData {
    pub field: String,
}
```

**Note:** `#[derive(Type)]` from specta is required for TypeScript generation.

### Error Types

Use typed enums for errors the frontend needs to handle:

```rust
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
#[serde(tag = "type")]
pub enum MyError {
    NotFound,
    ValidationError { message: String },
    IoError { message: String },
}
```

The `#[serde(tag = "type")]` makes errors easy to match in TypeScript:

```typescript
if (error.type === 'ValidationError') {
  console.log(error.message)
}
```

### Validation Functions

Keep validation in `types.rs` for reuse:

```rust
pub fn validate_input(input: &str) -> Result<(), String> {
    if input.is_empty() {
        return Err("Input cannot be empty".to_string());
    }
    Ok(())
}
```

## Platform-Specific Code

Use conditional compilation for platform-specific behavior:

```rust
#[cfg(target_os = "macos")]
fn macos_specific() { /* ... */ }

#[cfg(desktop)]
fn desktop_only() { /* ... */ }

#[cfg(not(target_os = "linux"))]
fn non_linux() { /* ... */ }
```

Platform utilities live in `utils/platform.rs`.

## Plugin Registration (lib.rs)

Plugins are registered in `lib.rs` during app setup:

```rust
// Desktop-only plugins
#[cfg(desktop)]
{
    app_builder = app_builder.plugin(tauri_plugin_window_state::Builder::new().build());
}

// All platforms
app_builder = app_builder
    .plugin(tauri_plugin_fs::init())
    .plugin(tauri_plugin_dialog::init())
```

**Order matters:** Single-instance plugin must be registered first.

## Conventions

| Pattern           | Example                                                       |
| ----------------- | ------------------------------------------------------------- |
| Command naming    | `snake_case` (`load_preferences`, not `loadPreferences`)      |
| Error returns     | `Result<T, String>` for simple errors, typed enum for complex |
| Logging           | Use `log::info!`, `log::debug!`, etc.                         |
| String formatting | `format!("{variable}")` not `format!("{}", variable)`         |
| App handle        | Pass `AppHandle` not `Window` when possible                   |

## Expanding This Architecture

When adding new features:

1. **New command domain?** Create new file in `commands/`
2. **New shared types?** Add to `types.rs`
3. **Platform-specific utils?** Add to `utils/platform.rs`
4. **New plugin?** Register in `lib.rs` setup
