# External APIs

Patterns for calling external HTTP APIs from Tauri applications.

> **Note:** HTTP client dependencies are not installed in this app. Install `reqwest` (Rust) and optionally `tauri-plugin-keyring` (for token storage) when your app needs external API calls.

## Rust vs Frontend: When to Use Which

**Default recommendation: Use Rust backend (reqwest)**

| Approach        | Pros                                              | Cons                           |
| --------------- | ------------------------------------------------- | ------------------------------ |
| Rust (reqwest)  | CORS bypass, secure token storage, type safety    | More code per endpoint         |
| Frontend (fetch)| Less boilerplate, familiar API                    | CORS restrictions, exposed keys|

### Use Rust Backend For

- All authenticated API calls (keeps tokens out of WebView)
- APIs with CORS restrictions (desktop apps bypass CORS from Rust)
- Calls requiring response caching to local storage
- Production applications

### Use Frontend Fetch For

- Public APIs with no authentication
- Rapid prototyping before moving to Rust
- Third-party SDKs requiring browser context

## Setup

```bash
# Rust HTTP client
cd src-tauri && cargo add reqwest --features json,rustls-tls

# Secure token storage (optional, for authenticated APIs)
npm install @tauri-apps/plugin-keyring
cd src-tauri && cargo add tauri-plugin-keyring
```

## Architecture Pattern

Follow the same pattern as local data: Tauri commands wrap API calls, TanStack Query provides caching.

```
React Component → TanStack Query → Tauri Command (reqwest) → External API
```

### Rust Command

```rust
use reqwest;
use serde::{Deserialize, Serialize};
use specta::Type;

#[derive(Debug, Clone, Serialize, Deserialize, Type)]
pub struct User {
    pub id: u32,
    pub name: String,
    pub email: String,
}

#[tauri::command]
#[specta::specta]
pub async fn fetch_user(user_id: u32) -> Result<User, String> {
    let client = reqwest::Client::new();

    let response = client
        .get(format!("https://api.example.com/users/{user_id}"))
        .timeout(std::time::Duration::from_secs(10))
        .send()
        .await
        .map_err(|e| format!("Network error: {e}"))?;

    if !response.status().is_success() {
        return Err(format!("API error: {}", response.status()));
    }

    response.json::<User>()
        .await
        .map_err(|e| format!("Parse error: {e}"))
}
```

### React Service

```typescript
// src/services/users.ts
export const userQueryKeys = {
  all: ['users'] as const,
  user: (id: number) => [...userQueryKeys.all, id] as const,
}

export function useUser(userId: number) {
  return useQuery({
    queryKey: userQueryKeys.user(userId),
    queryFn: async () => unwrapResult(await commands.fetchUser(userId)),
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ userId, data }: { userId: number; data: Partial<User> }) => {
      const result = await commands.updateUser(userId, data)
      if (result.status === 'error') throw new Error(result.error)
      return result.data
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: userQueryKeys.user(userId) })
    },
  })
}
```

## Authentication

### Token Storage

Store tokens securely using OS keychain, not in files:

```rust
// ✅ GOOD: OS keychain (encrypted, secure)
use tauri_plugin_keyring::KeyringExt;

#[tauri::command]
#[specta::specta]
pub async fn save_auth_token(app: tauri::AppHandle, token: String) -> Result<(), String> {
    app.keyring()
        .set_password("myapp_auth_token", &token)
        .map_err(|e| format!("Failed to save token: {e}"))
}

#[tauri::command]
#[specta::specta]
pub async fn get_auth_token(app: tauri::AppHandle) -> Result<Option<String>, String> {
    match app.keyring().get_password("myapp_auth_token") {
        Ok(token) => Ok(Some(token)),
        Err(_) => Ok(None),
    }
}
```

```rust
// ❌ BAD: File-based storage (unencrypted, insecure)
// tauri-plugin-store stores data as plain JSON on disk
```

### Authenticated Requests

```rust
#[tauri::command]
#[specta::specta]
pub async fn fetch_protected_data(app: tauri::AppHandle) -> Result<Data, String> {
    let token = app.keyring()
        .get_password("myapp_auth_token")
        .map_err(|_| "Not authenticated")?;

    let client = reqwest::Client::new();
    client
        .get("https://api.example.com/protected")
        .header("Authorization", format!("Bearer {token}"))
        .send()
        .await
        .map_err(|e| format!("Request failed: {e}"))?
        .json::<Data>()
        .await
        .map_err(|e| format!("Parse error: {e}"))
}
```

## Error Handling

See [error-handling.md](./error-handling.md) for complete patterns. Key points for API calls:

```typescript
// Configure retry for network errors, not validation errors
const { data } = useQuery({
  queryKey: ['api-data'],
  queryFn: fetchData,
  retry: (failureCount, error) => {
    if (error.message.includes('validation')) return false
    return failureCount < 3
  },
})
```

## Offline Handling

For apps that need to work offline, cache API responses to SQLite:

```rust
#[tauri::command]
#[specta::specta]
pub async fn fetch_with_cache(app: tauri::AppHandle, id: u32) -> Result<Data, String> {
    // Try network first
    match fetch_from_api(id).await {
        Ok(data) => {
            cache_to_db(&app, &data)?;  // Cache for offline
            Ok(data)
        }
        Err(_) => {
            // Fallback to cache on network error
            load_from_cache(&app, id)
        }
    }
}
```

See [data-persistence.md](./data-persistence.md) for SQLite setup.

## Quick Reference

| Task                     | Pattern                                  |
| ------------------------ | ---------------------------------------- |
| Basic API call           | Rust command with reqwest                |
| Caching                  | TanStack Query (frontend) or SQLite      |
| Token storage            | tauri-plugin-keyring (OS keychain)       |
| Type safety              | tauri-specta (same as local commands)    |
| Error handling           | Result types, see error-handling.md      |
| Offline support          | Cache to SQLite, fallback on network err |
