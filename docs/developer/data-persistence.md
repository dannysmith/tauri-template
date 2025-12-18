# Data Persistence

Patterns for saving and loading data to disk.

## Choosing a Storage Method

| Need               | Solution           | When to Use                                    |
| ------------------ | ------------------ | ---------------------------------------------- |
| App preferences    | Preferences System | Strongly-typed settings (theme, shortcuts)     |
| Emergency recovery | Recovery System    | Crash recovery, backup before risky operations |
| Relational data    | SQLite             | User data requiring queries, relationships     |
| External API data  | TanStack Query     | Remote data with caching (see [external-apis.md](./external-apis.md)) |

```
Need to persist data?
├─ App settings? → Preferences (Rust struct + TanStack Query)
├─ User data with queries/relationships? → SQLite (see below)
├─ Remote API data? → external-apis.md
└─ Emergency/crash recovery? → Recovery System
```

All data goes through Rust for type safety and security. Use TanStack Query on the frontend for loading states and cache invalidation.

## File Locations

```
~/Library/Application Support/com.myapp.app/  (macOS)
├── preferences.json                          # App preferences
└── recovery/                                 # Emergency data
    └── *.json
```

## Atomic Write Pattern (Critical)

All file writes use atomic operations to prevent corruption:

```rust
// Write to temp file first, then rename (atomic)
let temp_path = file_path.with_extension("tmp");
std::fs::write(&temp_path, content)?;
std::fs::rename(&temp_path, &file_path)?;
```

**Why**: If the app crashes during write, you either have the old file or the new file - never a corrupted partial file.

## Preferences System

### Rust Side

```rust
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct AppPreferences {
    pub theme: String,
    // Add new preferences here
}

impl Default for AppPreferences {
    fn default() -> Self {
        Self {
            theme: "system".to_string(),
        }
    }
}
```

### React Side

```typescript
// src/services/preferences.ts
export function usePreferences() {
  return useQuery({
    queryKey: ['preferences'],
    queryFn: async () => unwrapResult(await commands.loadPreferences()),
  })
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (preferences: AppPreferences) =>
      commands.savePreferences(preferences),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['preferences'] })
    },
  })
}
```

## Emergency Recovery System

For saving data before crashes or risky operations:

```typescript
// Save emergency data
await commands.saveEmergencyData({
  filename: 'unsaved-work',
  data: { content: userContent, timestamp: Date.now() },
})

// Load on startup
const recoveryData = await commands.loadEmergencyData({
  filename: 'unsaved-work',
})
if (recoveryData.status === 'ok' && recoveryData.data) {
  // Show recovery dialog
}
```

Recovery files are automatically cleaned up after 7 days via `cleanupOldRecoveryFiles`.

## Adding New Persistent Data

### 1. Define Rust struct

```rust
#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct MyData {
    pub field: String,
}

impl Default for MyData {
    fn default() -> Self {
        Self { field: "default".to_string() }
    }
}
```

### 2. Add Tauri commands

Follow the pattern in `src-tauri/src/commands/preferences.rs`:

- `load_*` command with Default fallback
- `save_*` command with atomic write

### 3. Register commands

Add to `src-tauri/src/bindings.rs` and regenerate bindings:

```bash
npm run rust:bindings
```

### 4. Create React hooks

```typescript
export function useMyData() {
  return useQuery({
    queryKey: ['my-data'],
    queryFn: async () => unwrapResult(await commands.loadMyData()),
  })
}
```

## Security

### Filename Validation

Always validate filenames to prevent path traversal:

```rust
if filename.contains("..") || filename.contains("/") || filename.contains("\\") {
    return Err("Invalid filename".to_string());
}
```

### Directory Permissions

Use Tauri's `app_data_dir()` for safe storage locations - never write to arbitrary paths.

## SQLite Database (When Needed)

> **Note:** SQLite is not installed in this app. Install `tauri-plugin-sql` when your app needs relational data with queries.

### When to Use SQLite

| Use Case                          | Recommendation         |
| --------------------------------- | ---------------------- |
| Simple key-value settings         | Preferences System     |
| User data with relationships      | SQLite                 |
| Data requiring complex queries    | SQLite                 |
| Large datasets (1000+ records)    | SQLite                 |
| Data needing atomic transactions  | SQLite                 |

### Setup

```bash
# Rust
cd src-tauri && cargo add tauri-plugin-sql --features sqlite

# JavaScript
npm install @tauri-apps/plugin-sql
```

Register the plugin with migrations in `src-tauri/src/lib.rs`:

```rust
use tauri_plugin_sql::{Builder, Migration, MigrationKind};

let migrations = vec![
    Migration {
        version: 1,
        description: "create_initial_tables",
        sql: "CREATE TABLE IF NOT EXISTS items (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
        );",
        kind: MigrationKind::Up,
    },
];

tauri::Builder::default()
    .plugin(
        tauri_plugin_sql::Builder::default()
            .add_migrations("sqlite:app.db", migrations)
            .build(),
    )
```

Add permissions in `src-tauri/capabilities/default.json`:

```json
{
  "permissions": ["sql:default", "sql:allow-load", "sql:allow-execute", "sql:allow-select"]
}
```

### Architecture Pattern

Follow the same pattern as other persistent data: Tauri commands wrap database operations, TanStack Query provides caching.

```
React Component → TanStack Query → Tauri Command → SQLite
```

```rust
// ✅ GOOD: Wrap SQL in typed commands (type safety via tauri-specta)
#[tauri::command]
#[specta::specta]
pub async fn get_items(app: tauri::AppHandle) -> Result<Vec<Item>, String> {
    let db = app.db("sqlite:app.db").map_err(|e| e.to_string())?;
    db.select("SELECT * FROM items ORDER BY created_at DESC")
        .map_err(|e| e.to_string())
}
```

```typescript
// ✅ GOOD: TanStack Query for caching and loading states
export function useItems() {
  return useQuery({
    queryKey: ['items'],
    queryFn: async () => unwrapResult(await commands.getItems()),
  })
}

export function useAddItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (item: CreateItem) => commands.addItem(item),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['items'] }),
  })
}
```

```typescript
// ❌ BAD: Direct database access from frontend (loses type safety)
import Database from '@tauri-apps/plugin-sql'
const db = await Database.load('sqlite:app.db')
const items = await db.select('SELECT * FROM items')
```

### Migration Rules

- Each migration has a unique incrementing version number
- Never modify existing migrations - always add new ones
- Write idempotent SQL (`IF NOT EXISTS`, `IF EXISTS`)
- Migrations run in transactions (atomic)
