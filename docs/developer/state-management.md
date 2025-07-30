# State Management

## Overview

### Local Component State -> `useState`

State that is only relevant to a single component (e.g., the value of an input field, whether a dropdown is open) uses the standard React `useState` and `useReducer` hooks.

### Global UI State -> Zustand

Transient global state related to the UI (e.g., `isSidebarVisible`, `isCommandPaletteOpen`) uses small, slices Zustand stores for different UI domains (e.g., `useMainUIStore.ts`, `useMyFancyFeaturePanelStore.ts`).

### All Persisted State -> Tanstack Query

Data that originates from outside of the react app, either from the Rust backend (eg read from disk) or from external services and APIs uses TanStack Query. Use **TanStack Query**. All `invoke` calls should be wrapped in `useQuery` or `useMutation` hooks within the `src/services/` directory. This handles loading, error, and caching states automatically.

### Data on local disk

Certain settings data should be persisted to local storage (in addition to or instead of to any remote backend system). This should usually be written to the applications support directory (eg. ``~/Library/Application Support/com.myapp.app/recovery/` on macOS). This is handled by Tauri's [filesystem plugin](https://v2.tauri.app/plugin/file-system/) and should be accessed and written in the same way as any other state which is not "owned" by the React App... ie via Tanstack Query.

## The "Onion" Pattern: Three-Layer State Architecture

The most critical architectural decision is how to organize state management. We discovered a three-layer "onion" approach that provides optimal performance and maintainability:

#### Layer 1: Server State (TanStack Query)

Use TanStack Query for state that:

- Comes from the Tauri backend (file system, external APIs)
- Benefits from caching and automatic refetching
- Needs to be synchronized across components
- Has loading, error, and success states

Example:

```typescript
// Query for server data
const {
  data: userData,
  isLoading,
  error,
} = useQuery({
  queryKey: ['user', userId, 'profile'],
  queryFn: () => invokeCommand('get_user_profile', { userId }),
  enabled: !!userId,
})
```

#### Layer 2: Client State (Decomposed Zustand Stores)

Break Zustand into focused, domain-specific stores. Examples:

```typescript
// AppStore - Application-level state
interface AppState {
  currentUser: User | null
  theme: 'light' | 'dark'
  setCurrentUser: (user: User | null) => void
  toggleTheme: () => void
}

// UIStore - UI layout state
interface UIState {
  sidebarVisible: boolean
  commandPaletteOpen: boolean
  toggleSidebar: () => void
  setCommandPaletteOpen: (open: boolean) => void
}
```

**Why This Decomposition?**

- **Performance**: Only relevant components re-render when specific state changes
- **Clarity**: Each store has a single, focused responsibility
- **Maintainability**: Easier to reason about and modify individual concerns
- **Testability**: Each store can be tested independently

#### Layer 3: Local State (React useState)

Keep state local when it:

- Only affects UI presentation
- Is derived from props or global state
- Doesn't need persistence
- Is tightly coupled to component lifecycle

```typescript
// UI presentation state
const [windowWidth, setWindowWidth] = useState(window.innerWidth)
const [isDropdownOpen, setIsDropdownOpen] = useState(false)
```

### Store Boundary Guidelines

**AppStore** - Use for:

- Application-wide settings
- Current user information
- Theme and preferences
- Global application state

**UIStore** - Use for:

- Panel visibility
- Layout state
- UI modes and navigation
- Command palette state

**Feature-specific stores** - Use for:

- Domain-specific state (e.g., `useDocumentStore`, `useNotificationStore`)
- Feature flags and configuration
- Temporary workflow state

## Implementation Examples

### Basic Zustand Store

```typescript
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

interface UIState {
  sidebarVisible: boolean
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>()(
  devtools(
    set => ({
      sidebarVisible: true,
      toggleSidebar: () =>
        set(state => ({ sidebarVisible: !state.sidebarVisible })),
    }),
    { name: 'ui-store' }
  )
)
```

### TanStack Query with Tauri Commands

```typescript
import { useQuery, useMutation } from '@tanstack/react-query'
import { invokeCommand } from '@/lib/commands'

// Query hook
export function useUserProfile(userId: string) {
  return useQuery({
    queryKey: ['user', userId],
    queryFn: () => invokeCommand<User>('get_user', { userId }),
    enabled: !!userId,
  })
}

// Mutation hook
export function useUpdateUserProfile() {
  return useMutation({
    mutationFn: (userData: Partial<User>) =>
      invokeCommand('update_user', userData),
    onSuccess: () => {
      // Invalidate and refetch user queries
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
  })
}
```
