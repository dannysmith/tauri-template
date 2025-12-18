# Cross-Platform Development

This app supports macOS, Windows, and Linux. This guide covers platform-specific patterns, utilities, and configuration.

## Overview

| Platform | Title Bar         | Window Controls | Decorations |
| -------- | ----------------- | --------------- | ----------- |
| macOS    | Custom + vibrancy | Left (traffic)  | Hidden      |
| Windows  | Custom            | Right           | Hidden      |
| Linux    | Native + toolbar  | Native          | Visible     |

**Design decisions:**

- macOS is the primary development target
- No Windows code signing (configure your own certificates)
- Linux uses native decorations for desktop environment compatibility
- Keyboard shortcuts use `mod+` prefix (Cmd on macOS, Ctrl elsewhere)

## Platform Detection

### Frontend (React)

Use the platform hook for UI decisions:

```typescript
import { usePlatform, getPlatform } from '@/hooks/use-platform'

// In components
function MyComponent() {
  const platform = usePlatform()

  if (platform === 'macos') {
    return <MacOSSpecificUI />
  }
  // ...
}

// In callbacks or non-hook contexts
function handleAction() {
  const platform = getPlatform()
  // ...
}
```

Convenience hooks are also available:

```typescript
import { useIsMacOS, useIsWindows, useIsLinux } from '@/hooks/use-platform'

function MyComponent() {
  const isMacOS = useIsMacOS()
  // ...
}
```

### Backend (Rust)

Use conditional compilation for platform-specific code:

```rust
// Compile-time checks (preferred for performance)
#[cfg(target_os = "macos")]
fn macos_only() {
    // Only compiled on macOS
}

#[cfg(target_os = "windows")]
fn windows_only() {
    // Only compiled on Windows
}

#[cfg(target_os = "linux")]
fn linux_only() {
    // Only compiled on Linux
}

// Runtime checks (for dynamic behavior)
use crate::utils::platform;

if platform::is_macos() {
    // macOS runtime behavior
}
```

## Platform-Specific Strings

Use `getPlatformStrings()` for platform-appropriate UI labels:

```typescript
import { getPlatformStrings, formatShortcut } from '@/lib/platform-strings'
import { usePlatform } from '@/hooks/use-platform'

function FileMenu() {
  const platform = usePlatform()
  const strings = getPlatformStrings(platform)

  return (
    <MenuItem>
      {strings.revealInFileManager} {/* "Reveal in Finder" or "Show in Explorer" */}
    </MenuItem>
  )
}

// Format keyboard shortcuts for display
formatShortcut('macos', 'K') // "⌘K"
formatShortcut('windows', 'K') // "Ctrl+K"
formatShortcut('macos', 'S', ['shift', 'mod']) // "⇧⌘S"
```

Available strings:

| Property              | macOS              | Windows            | Linux           |
| --------------------- | ------------------ | ------------------ | --------------- |
| `revealInFileManager` | "Reveal in Finder" | "Show in Explorer" | "Show in Files" |
| `fileManagerName`     | "Finder"           | "Explorer"         | "Files"         |
| `modifierKey`         | "Cmd"              | "Ctrl"             | "Ctrl"          |
| `modifierKeySymbol`   | "⌘"                | "Ctrl"             | "Ctrl"          |
| `optionKey`           | "Option"           | "Alt"              | "Alt"           |
| `preferencesLabel`    | "Preferences"      | "Settings"         | "Preferences"   |
| `quitLabel`           | "Quit"             | "Exit"             | "Quit"          |
| `trashName`           | "Trash"            | "Recycle Bin"      | "Trash"         |

## Title Bar Architecture

The title bar system uses platform detection to render appropriate controls:

```
TitleBar.tsx (router)
├── macOS: MacOSWindowControls (left) + TitleBarContent
├── Windows: TitleBarContent + WindowsWindowControls (right)
└── Linux: LinuxTitleBar (toolbar only, no window controls)
```

### Testing Other Platforms

In development, use the `forcePlatform` prop to preview other platform layouts:

```tsx
// Only works in development builds
<TitleBar forcePlatform="windows" />
<TitleBar forcePlatform="linux" />
```

### Custom Title Bars

If building custom title bars, use the shared components:

```tsx
import {
  TitleBarLeftActions,
  TitleBarRightActions,
  TitleBarTitle,
} from '@/components/titlebar'

function CustomTitleBar() {
  return (
    <div data-tauri-drag-region className="...">
      <TitleBarLeftActions />
      <TitleBarTitle title="My App" />
      <TitleBarRightActions />
    </div>
  )
}
```

## Path Handling

Windows uses backslashes (`\`) in paths, but the frontend expects forward slashes (`/`). Normalize paths when sending from Rust to React:

```rust
use crate::utils::platform::normalize_path_for_serialization;

#[tauri::command]
fn get_file_path() -> String {
    let path = some_path();
    // Converts "C:\Users\foo\file.txt" to "C:/Users/foo/file.txt"
    normalize_path_for_serialization(&path)
}
```

The frontend can then use paths consistently:

```typescript
// Works on all platforms
const parts = filePath.split('/')
```

## Tauri Configuration

Tauri v2 automatically merges platform-specific config files using [JSON Merge Patch](https://datatracker.ietf.org/doc/html/rfc7396).

### Config Files

```
src-tauri/
├── tauri.conf.json         # Base config (safe defaults)
├── tauri.macos.conf.json   # macOS overrides
├── tauri.windows.conf.json # Windows overrides
└── tauri.linux.conf.json   # Linux overrides
```

### Key Differences

**Base config** (`tauri.conf.json`):

```json
{
  "app": {
    "windows": [
      {
        "decorations": true,
        "transparent": false
      }
    ]
  }
}
```

**macOS** (`tauri.macos.conf.json`):

```json
{
  "app": {
    "windows": [
      {
        "decorations": false,
        "transparent": true,
        "windowEffects": {
          "effects": ["hudWindow"]
        }
      }
    ]
  }
}
```

**Windows** (`tauri.windows.conf.json`):

```json
{
  "app": {
    "windows": [
      {
        "decorations": false,
        "transparent": false
      }
    ]
  }
}
```

**Linux** (`tauri.linux.conf.json`):

```json
{
  "app": {
    "windows": [
      {
        "decorations": true,
        "transparent": false
      }
    ]
  }
}
```

### Important: JSON Merge Patch Behavior

JSON Merge Patch **replaces arrays entirely**, not element-by-element. Each platform config must include the **complete** `windows` array with all properties, not just overrides.

## Building for Each Platform

### Development

```bash
# Runs on current platform
npm run dev
```

### Production Builds

Builds are platform-specific. You can only build for your current OS (cross-compilation requires additional setup):

```bash
# Build for current platform
npm run build
```

### CI/CD Builds

The GitHub Actions release workflow builds for all platforms:

| Platform | Runner           | Output      |
| -------- | ---------------- | ----------- |
| macOS    | `macos-latest`   | `.dmg`      |
| Windows  | `windows-latest` | `.msi`      |
| Linux    | `ubuntu-22.04`   | `.AppImage` |

See `.github/workflows/release.yml` for the full configuration.

### Linux Dependencies

Linux builds require additional system libraries:

```bash
sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  libappindicator3-dev \
  librsvg2-dev \
  patchelf
```

## CSS Considerations

### Windows Drag Regions

Windows requires an additional CSS rule for drag regions to work with touch/pen input:

```css
*[data-tauri-drag-region] {
  app-region: drag;
}
```

This is already included in the app's global styles.

### GPU Acceleration

For opacity transitions on Windows title bars, use `transform-gpu` to fix WebKit rendering quirks:

```tsx
<div className="transform-gpu transition-opacity" />
```

## Best Practices

1. **Test with `forcePlatform`** - Verify layouts for all platforms during development
2. **Use platform strings** - Never hardcode platform-specific labels
3. **Normalize paths** - Always convert Windows paths before sending to frontend
4. **Prefer conditional compilation** - Use `#[cfg(...)]` over runtime checks in Rust when possible
5. **Keep Linux simple** - Native decorations work best across desktop environments
6. **Document platform assumptions** - Note any platform-specific behavior in comments

## Files Reference

| File                                   | Purpose                      |
| -------------------------------------- | ---------------------------- |
| `src/hooks/use-platform.ts`            | Platform detection hooks     |
| `src/lib/platform-strings.ts`          | Platform-specific UI strings |
| `src/components/titlebar/TitleBar.tsx` | Platform-aware title bar     |
| `src-tauri/src/utils/platform.rs`      | Rust platform utilities      |
| `src-tauri/tauri.*.conf.json`          | Platform-specific configs    |
