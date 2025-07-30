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
  data: somedata,
  isLoading,
  error,
} = useQuery({
  queryKey: ['project', projectPath, 'domedata'],
  queryFn: () => invoke('scan_project', { projectPath }),
  enabled: !!projectPath,
})
```

#### Layer 2: Client State (Decomposed Zustand Stores)

Break Zustand into focused, domain-specific stores. Examples:

```typescript
// SomeProjectStore - Project-level identifiers
interface SomeProjectState {
  SomeprojectData: string | null
  // Actions for project operations
}

// UIStore - UI layout state
interface UIState {
  sidebarVisible: boolean
  frontmatterPanelVisible: boolean
  // Actions for UI operations
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

**EditorStore** - Use for:

- Current file being edited
- Editor content and frontmatter
- Dirty/save state
- Auto-save functionality

**ProjectStore** - Use for:

- Project path and identifiers
- Selected collection
- User settings and preferences

**UIStore** - Use for:

- Panel visibility
- Layout state
- UI modes (focus mode, etc.)
