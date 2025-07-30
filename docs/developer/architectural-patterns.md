# Architectural Patterns & Best Practices

This document captures the unique architectural patterns evolved during the development of this Tauri + React boilerplate. These patterns solve real-world problems and aren't easily discovered from standard documentation.

## Table of Contents

1. [State Management "Onion" Pattern](#state-management-onion-pattern)
2. [Command System Architecture](#command-system-architecture)
3. [Tauri-React Bridge Patterns](#tauri-react-bridge-patterns)
4. [Hook Extraction & State Interaction Patterns](#hook-extraction--state-interaction-patterns)
5. [Component Architecture Guidelines](#component-architecture-guidelines)
6. [Keyboard Shortcuts & Event Management](#keyboard-shortcuts--event-management)
7. [Preferences System Architecture](#preferences-system-architecture)
8. [Security Patterns](#security-patterns)

---

## State Management "Onion" Pattern

### The Three Layers

Our state management follows a clear hierarchy that prevents complexity and ensures predictable data flow:

```
┌─────────────────────────────────────┐
│           useState                  │  ← Ephemeral Component UI State
│  ┌─────────────────────────────────┐│
│  │          Zustand                ││  ← Ephemeral Global UI State
│  │  ┌─────────────────────────────┐││
│  │  │      TanStack Query         │││  ← Persistent Data Not "Owned" by React
│  │  └─────────────────────────────┘││
│  └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### Layer 1: useState (Component-Level)

**Use for:** Transient UI state that dies with the component

```typescript
// ✅ Good: Form input values, modal open state, loading indicators
const [inputValue, setInputValue] = useState('')
const [isModalOpen, setIsModalOpen] = useState(false)
const [isLoading, setIsLoading] = useState(false)

// ❌ Bad: Data that needs to persist, global state
const [userSettings, setUserSettings] = useState({}) // Should be TanStack Query
const [sidebarVisible, setSidebarVisible] = useState(true) // Should be Zustand
```

### Layer 2: Zustand (Global UI State)

**Use for:** UI state that needs to be shared across components but doesn't persist

```typescript
// ✅ Good: Layout states, UI preferences, temporary selections
interface UIState {
  sidebarVisible: boolean
  rightPanelVisible: boolean
  currentTheme: 'light' | 'dark' | 'system'

  toggleSidebar: () => void
  toggleRightPanel: () => void
}

// ❌ Bad: Data that should persist between sessions
interface BadUIState {
  userSettings: AppSettings // Should be TanStack Query
  fileContent: string // Should be TanStack Query
}
```

### Layer 3: TanStack Query (Persistent Data)

**Use for:** Any data that comes from outside React (Rust backend, APIs, local storage)

```typescript
// ✅ Good: Settings, file content, API data
const { data: settings } = useQuery({
  queryKey: queryKeys.settings(),
  queryFn: () => invoke<AppSettings>('load_settings')
})

// ❌ Bad: UI state, temporary values
const { data: sidebarVisible } = useQuery(...) // Should be Zustand
```

### Decision Tree

```
Is this data needed across multiple components?
├─ No → useState
└─ Yes → Does this data persist between app sessions?
    ├─ No → Zustand
    └─ Yes → TanStack Query
```

---

## Command System Architecture

The command system decouples UI actions from implementations, enabling consistent behavior across keyboard shortcuts, menus, and command palette.

### Core Components

#### 1. Command Definition Pattern

```typescript
// Each command is a pure object with predictable structure
export const navigationCommands: AppCommand[] = [
  {
    id: 'toggle-sidebar',
    label: 'Toggle Sidebar',
    description: 'Show or hide the sidebar',
    icon: Sidebar,
    group: 'navigation',
    execute: (context: CommandContext) => {
      context.toggleSidebar()
    },
    isAvailable: () => true, // Dynamic availability
  },
]
```

#### 2. Command Context Pattern

The context provides all state and actions commands need:

```typescript
export function useCommandContext(): CommandContext {
  const { currentFolder, settings, setCurrentFolder } = useProjectStore()
  const { toggleSidebar, toggleRightPanel } = useUIStore()

  return {
    // State
    currentFolder,
    settings,

    // Actions
    setCurrentFolder,
    toggleSidebar,
    toggleRightPanel,

    // Bridge patterns
    openPreferences: () => {
      window.dispatchEvent(new CustomEvent('open-preferences'))
    },
  }
}
```

#### 3. Command Registration Pattern

Commands are organized by domain and merged at execution time:

```typescript
export function getAllCommands(
  context: CommandContext,
  searchValue = ''
): AppCommand[] {
  const allCommands = [
    ...navigationCommands,
    ...fileCommands,
    ...notificationCommands,
    ...settingsCommands,
  ].filter(command => command.isAvailable(context))

  // Search filtering
  if (searchValue) {
    const search = searchValue.toLowerCase()
    return allCommands.filter(
      cmd =>
        cmd.label.toLowerCase().includes(search) ||
        cmd.description?.toLowerCase().includes(search)
    )
  }

  return allCommands
}
```

### Usage Patterns

#### Adding New Commands

1. **Define the command group:**

```typescript
export const myFeatureCommands: AppCommand[] = [
  {
    id: 'my-action',
    label: 'My Action',
    group: 'my-feature',
    execute: context => {
      // Access state: context.currentFolder
      // Call actions: context.setCurrentFolder()
      // Show feedback: toast.success()
    },
    isAvailable: context => context.currentFolder !== null,
  },
]
```

2. **Register in getAllCommands:**

```typescript
const allCommands = [
  ...navigationCommands,
  ...myFeatureCommands, // Add here
  ...settingsCommands,
]
```

3. **Update context if needed:**

```typescript
// Add new actions to CommandContext type and useCommandContext()
```

#### Command Execution Flow

```
User Input → Command Palette/Menu/Shortcut → Command.execute(context) → State Change → UI Update
```

---

## Tauri-React Bridge Patterns

### 1. Event-Driven Communication

The bridge uses events for loose coupling between Rust and React:

#### Rust → React (Native Menu Events)

```rust
// In main.rs - Emit events from menu actions
app.on_menu_event(move |app, event| match event.id().as_ref() {
    "toggle_sidebar" => {
        let _ = app.emit("menu-toggle-sidebar", ());
    }
    "preferences" => {
        let _ = app.emit("menu-preferences", ());
    }
    _ => {}
});
```

```typescript
// In React - Listen for events
useEffect(() => {
  const setupListeners = async () => {
    const unlisteners = await Promise.all([
      listen('menu-toggle-sidebar', () => {
        useUIStore.getState().toggleSidebar()
      }),
      listen('menu-preferences', () => {
        handleSetPreferencesOpen(true)
      }),
    ])
    return unlisteners
  }

  void setupListeners()
}, [])
```

#### React → Rust (Command Invocation)

```typescript
// Async command pattern with error handling
const handleOpenFolder = async () => {
  try {
    const folderPath = await invoke<string>('select_folder')
    if (folderPath) {
      useProjectStore.getState().setCurrentFolder(folderPath)
      toast.success('Folder opened successfully')
    }
  } catch (error) {
    toast.error('Failed to open folder', {
      description:
        error instanceof Error ? error.message : 'Unknown error occurred',
    })
  }
}
```

### 2. Toast Bridge Pattern

For Rust-initiated notifications:

```rust
// Rust side - Send structured toast events
let toast_event = RustToastEvent {
    r#type: "error".to_string(),
    message: "Cannot open this directory".to_string(),
    description: Some("This directory is restricted for security reasons.".to_string()),
    duration: None,
};
app.emit("rust-toast", toast_event)?;
```

```typescript
// React side - Convert to React toasts
export async function initializeRustToastBridge() {
  const unlisten = await listen<RustToastEvent>('rust-toast', event => {
    const { type, message, description } = event.payload

    switch (type) {
      case 'success':
        toast.success(message, { description })
        break
      case 'error':
        toast.error(message, { description })
        break
      // ... other types
    }
  })

  return unlisten
}
```

### 3. Security-First Command Pattern

All file operations include validation:

```rust
#[tauri::command]
pub async fn select_folder(app: tauri::AppHandle) -> Result<Option<String>, String> {
    match rfd::AsyncFileDialog::new().pick_folder().await {
        Some(folder) => {
            let folder_path = folder.path();

            // Security check
            if is_blocked_directory(folder_path) {
                send_toast_notification(&app, "error", "Cannot open this directory",
                    Some("This directory is restricted for security reasons."));
                return Err("Restricted directory".to_string());
            }

            Ok(Some(folder_path.to_string_lossy().to_string()))
        }
        None => Ok(None),
    }
}
```

---

## Hook Extraction & State Interaction Patterns

### When to Extract into Hooks

**Extract when you have:**

- Stateful logic used in multiple components
- Complex side effects (API calls, event listeners)
- Reusable patterns with lifecycle management

### Hook Pattern: State + Side Effects

```typescript
// ✅ Good: Encapsulates related state and effects
export function useLayoutEventListeners() {
  const [preferencesOpen, setPreferencesOpen] = useState(false)

  // Encapsulate callback creation
  const handleSetPreferencesOpen = useCallback((open: boolean) => {
    setPreferencesOpen(open)
  }, [])

  // Manage keyboard shortcuts
  useHotkeys(
    'mod+comma',
    () => {
      handleSetPreferencesOpen(true)
    },
    { preventDefault: true }
  )

  // Manage Tauri event listeners
  useEffect(() => {
    const setupListeners = async () => {
      const unlisteners = await Promise.all([
        listen('menu-preferences', () => {
          handleSetPreferencesOpen(true)
        }),
      ])
      return unlisteners
    }

    void setupListeners()
  }, [handleSetPreferencesOpen])

  return {
    preferencesOpen,
    setPreferencesOpen: handleSetPreferencesOpen,
  }
}
```

### Store Interaction Pattern: Direct Access

**Key Principle:** Use `getState()` in callbacks to avoid dependency arrays:

```typescript
// ✅ Good: Direct store access in callbacks
useHotkeys('mod+1', () => {
  useUIStore.getState().toggleSidebar() // No dependencies needed
})

// ❌ Bad: Store values in dependencies
const { toggleSidebar } = useUIStore()
useHotkeys(
  'mod+1',
  () => {
    toggleSidebar() // Creates unnecessary re-renders
  },
  [toggleSidebar]
)
```

### Hook Composition Pattern

```typescript
// Compose multiple hooks for complex behavior
export function useAppLayout() {
  const eventListeners = useLayoutEventListeners()
  const commandPalette = useCommandPalette()
  const preferences = usePreferences()

  return {
    ...eventListeners,
    ...commandPalette,
    ...preferences,
  }
}
```

### Custom Hook Guidelines

1. **Return objects, not arrays** (for selective destructuring)
2. **Use `useCallback` for functions** (prevent unnecessary re-renders)
3. **Keep hooks focused** (single responsibility)
4. **Handle cleanup** (return cleanup functions from useEffect)

---

## Component Architecture Guidelines

### Hierarchical Structure

```
MainWindow (Top-level orchestrator)
├── TitleBar (Window controls, app title + toolbar buttons)
├── LeftSidebar (Collapsible)
├── MainWindowContent (Primary content)
└── RightSidebar (Collapsible)
└── Global Components
    ├── PreferencesDialog (Modal)
    ├── CommandPalette (Overlay)
    └── Toaster (Notifications)
```

### Component Responsibility Pattern

#### 1. Layout Components (Structure)

```typescript
// Focus: Layout, no business logic
export const MainWindow: React.FC = () => {
  const { preferencesOpen, setPreferencesOpen } = useLayoutEventListeners()

  return (
    <div className="flex flex-col h-screen">
      <UnifiedTitleBar />
      <LeftSidebar />
      <MainWindowContent />
      <RightSidebar />

      {/* Global overlays */}
      <PreferencesDialog open={preferencesOpen} onOpenChange={setPreferencesOpen} />
      <CommandPalette />
      <Toaster />
    </div>
  )
}
```

#### 2. Content Components (Data + Presentation)

```typescript
// Focus: Data fetching + presentation
export const MainEditor: React.FC = () => {
  const { currentFolder } = useProjectStore()

  if (!currentFolder) {
    return <WelcomeScreen />
  }

  return <MainContent />
}
```

#### 3. UI Components (Pure Presentation)

```typescript
// Focus: Pure presentation, receive all data as props
interface WelcomeScreenProps {
  onOpenFolder: () => void
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onOpenFolder }) => (
  <div className="flex items-center justify-center h-full">
    <Button onClick={onOpenFolder}>Open Folder</Button>
  </div>
)
```

### Component Extraction Rules

1. **Extract when JSX > 50 lines** or **logic > 20 lines**
2. **Extract reusable patterns** (3+ uses)
3. **Extract complex conditional rendering**
4. **Keep components focused** (single responsibility)

---

## Keyboard Shortcuts & Event Management

### Centralized Shortcut Pattern

All shortcuts are managed in one place to prevent conflicts:

```typescript
export function useLayoutEventListeners() {
  // Global shortcuts with consistent options
  const shortcutOptions = {
    preventDefault: true,
    enableOnFormTags: ['input', 'textarea', 'select'],
    enableOnContentEditable: true,
  }

  useHotkeys(
    'mod+1',
    () => {
      useUIStore.getState().toggleSidebar()
    },
    shortcutOptions
  )

  useHotkeys(
    'mod+2',
    () => {
      useUIStore.getState().toggleRightPanel()
    },
    shortcutOptions
  )

  useHotkeys(
    'mod+comma',
    () => {
      handleSetPreferencesOpen(true)
    },
    shortcutOptions
  )
}
```

### Multi-Source Event Coordination

The same action can be triggered from multiple sources:

```typescript
// 1. Keyboard shortcut
useHotkeys('mod+comma', () => handleSetPreferencesOpen(true))

// 2. Native menu (via Tauri event)
listen('menu-preferences', () => handleSetPreferencesOpen(true))

// 3. Command palette
{
  id: 'open-preferences',
  execute: (context) => context.openPreferences()
}

// 4. DOM event (from other components)
window.addEventListener('open-preferences', () => handleSetPreferencesOpen(true))
```

### Event Cleanup Pattern

Always clean up event listeners:

```typescript
useEffect(() => {
  const unlistenFunctions: Array<() => void> = []

  const setupListeners = async () => {
    const unlisteners = await Promise.all([
      listen('menu-toggle-sidebar', handler1),
      listen('menu-preferences', handler2),
    ])
    unlistenFunctions.push(...unlisteners)
  }

  void setupListeners()

  return () => {
    unlistenFunctions.forEach(unlisten => {
      if (unlisten && typeof unlisten === 'function') {
        unlisten()
      }
    })
  }
}, [])
```

---

## Preferences System Architecture

### Multi-Pane Structure

The preferences system uses a sidebar navigation pattern:

```typescript
// PreferencesDialog.tsx - Main container
export const PreferencesDialog: React.FC<Props> = ({ open, onOpenChange }) => {
  const [selectedPane, setSelectedPane] = useState('general')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[600px]">
        <div className="flex h-full">
          {/* Navigation Sidebar */}
          <div className="w-48 border-r">
            <PreferencesSidebar
              selectedPane={selectedPane}
              onSelectPane={setSelectedPane}
            />
          </div>

          {/* Content Area */}
          <div className="flex-1">
            <PreferencesContent pane={selectedPane} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
```

### Pane Registration Pattern

New preference panes are registered centrally:

```typescript
// Each pane is a self-contained component
const PREFERENCE_PANES = [
  {
    id: 'general',
    label: 'General',
    icon: Settings,
    component: GeneralPane,
  },
  {
    id: 'appearance',
    label: 'Appearance',
    icon: Palette,
    component: AppearancePane,
  },
] as const
```

### Settings Persistence Pattern

Settings are handled through the store + TanStack Query:

```typescript
// In preference pane component
export const GeneralPane: React.FC = () => {
  const { settings, updateSettings } = useProjectStore()

  const handleThemeChange = (theme: Theme) => {
    void updateSettings({ theme })
  }

  return (
    <div className="p-6 space-y-6">
      <FormSection title="Appearance">
        <Select value={settings?.theme} onValueChange={handleThemeChange}>
          {/* Theme options */}
        </Select>
      </FormSection>
    </div>
  )
}
```

---

## Security Patterns

### Path Validation Pattern

All file operations validate paths to prevent traversal attacks:

```rust
fn is_blocked_directory(path: &Path) -> bool {
    let path_str = path.to_string_lossy();

    let blocked_patterns = [
        "/System/", "/usr/", "/etc/", "/bin/", "/sbin/",
        "/Library/Frameworks/", "/.ssh/", "/.aws/",
    ];

    blocked_patterns.iter().any(|pattern| path_str.starts_with(pattern))
}

#[tauri::command]
pub async fn select_folder(app: tauri::AppHandle) -> Result<Option<String>, String> {
    if let Some(folder) = rfd::AsyncFileDialog::new().pick_folder().await {
        let folder_path = folder.path();

        if is_blocked_directory(folder_path) {
            send_toast_notification(&app, "error", "Restricted directory", None);
            return Err("Cannot access restricted directory".to_string());
        }

        Ok(Some(folder_path.to_string_lossy().to_string()))
    } else {
        Ok(None)
    }
}
```

### Error Handling Pattern

Consistent error handling across the bridge:

```typescript
// Standard error handling pattern for Tauri commands
const safeInvoke = async <T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T | null> => {
  try {
    return await invoke<T>(command, args)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred'
    toast.error(`Failed to ${command}`, { description: message })

    if (import.meta.env.DEV) {
      console.error(`Command ${command} failed:`, error)
    }

    return null
  }
}
```

### Input Sanitization

```rust
// Sanitize file paths and validate inputs
pub fn sanitize_filename(filename: &str) -> String {
    filename
        .chars()
        .filter(|c| !['/', '\\', ':', '*', '?', '"', '<', '>', '|'].contains(c))
        .collect()
}
```

---

## Summary

These patterns emerged from real-world development challenges and provide:

1. **Predictable State Flow** - Clear hierarchy prevents state management chaos
2. **Decoupled Architecture** - Command system enables consistent behavior across all interaction methods
3. **Type-Safe Bridge** - Structured communication between Rust and React with proper error handling
4. **Maintainable Components** - Clear responsibility boundaries and extraction guidelines
5. **Secure Operations** - Built-in security patterns for file system operations
6. **Extensible Preferences** - Scalable system for application settings

Each pattern can be adopted independently, but they work best together as a cohesive architectural system.
