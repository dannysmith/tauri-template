# Task: Cross-Platform Support

## Overview

This Tauri template currently only works properly on macOS. This task prepares the codebase for cross-platform support (Windows, Linux) through careful refactoring that **doesn't break macOS functionality**.

This is structured as work that can be done and tested on macOS. Actual Windows/Linux testing would be separate follow-up work.

**Key Decisions:**

- No Windows code signing
- No in-window menu bars for Windows/Linux - functionality accessible via keyboard shortcuts and buttons
- Keyboard shortcuts: Use `mod+` prefix which automatically maps to Cmd on macOS and Ctrl on Windows/Linux
- Linux uses native window decorations with custom toolbar below

---

## Phase 1: Platform Detection Utilities

**Goal:** Create reusable platform detection for React components and Rust code.

**Current State:**

- No platform detection exists in frontend
- `use-mobile.ts` only checks viewport width, not OS
- No Rust-side platform utilities

**Prerequisites:**

- `@tauri-apps/plugin-os` is already available in Tauri v2

**Tasks:**

1. **Install OS plugin**
   - [ ] Add `tauri-plugin-os` to Cargo.toml
   - [ ] Initialize plugin in `lib.rs`
   - [ ] Install `@tauri-apps/plugin-os` npm package

2. **Create platform detection hook**
   - [ ] Create `src/hooks/use-platform.ts`
   - [ ] Export `usePlatform()` hook returning `'macos' | 'windows' | 'linux' | undefined`
   - [ ] Export `getPlatform()` async function for non-hook contexts

3. **Create platform-specific strings utility**
   - [ ] Create `src/lib/platform-strings.ts`
   - [ ] Map platform to UI strings (e.g., "Reveal in Finder" vs "Show in Explorer")

4. **Create Rust platform helpers**
   - [ ] Create `src-tauri/src/utils/platform.rs` (if needed for future commands)
   - [ ] Add `#[cfg(target_os = "...")]` patterns documentation

**Code Pattern:**

```typescript
// src/hooks/use-platform.ts
import { platform, type Platform } from '@tauri-apps/plugin-os'

export type AppPlatform = 'macos' | 'windows' | 'linux'

export function usePlatform(): AppPlatform | undefined {
  const [currentPlatform, setCurrentPlatform] = useState<AppPlatform>()

  useEffect(() => {
    platform().then((p: Platform) => {
      if (p === 'macos') setCurrentPlatform('macos')
      else if (p === 'windows') setCurrentPlatform('windows')
      else setCurrentPlatform('linux')
    })
  }, [])

  return currentPlatform
}
```

**Acceptance Criteria:**

- [ ] `usePlatform()` hook works on macOS (returns 'macos')
- [ ] Pattern documented for future use
- [ ] No breaking changes to existing functionality

---

## Phase 2: Title Bar Refactoring

**Goal:** Decompose the unified title bar to support platform-specific implementations.

**Current State:**

- `MacOSWindowControls.tsx` - macOS traffic light buttons (hardcoded)
- `TitleBar.tsx` - Main title bar component
- No platform detection - always renders macOS controls
- macOS-specific colors hardcoded (#ff544d, #ffbd2e, #28c93f)

**Approach:**

- **macOS:** Custom title bar with traffic lights on LEFT (current behavior)
- **Windows:** Custom title bar with window controls on RIGHT (minimize/maximize/close)
- **Linux:** Native decorations (`decorations: true`) + custom toolbar below (no window controls)

**Tasks:**

1. **Extract shared components**
   - [ ] Identify shared title bar content (toolbar items, title text)
   - [ ] Create `TitleBarContent.tsx` for shared toolbar/content
   - [ ] Ensure macOS version still works identically after extraction

2. **Create Windows title bar**
   - [ ] Create `WindowsWindowControls.tsx` with controls on RIGHT
   - [ ] Use Windows-style icons (not traffic lights)
   - [ ] Wire up minimize/maximize/close to Tauri window API
   - [ ] Apply `data-tauri-drag-region` for dragging

3. **Create Linux toolbar**
   - [ ] Create `LinuxTitleBar.tsx` as toolbar only (no window controls)
   - [ ] Styled to work below native window decorations
   - [ ] Include same toolbar items as other platforms

4. **Create platform wrapper**
   - [ ] Update `TitleBar.tsx` to use `usePlatform()`
   - [ ] Conditionally render correct component per platform
   - [ ] Add loading state while platform is detected

5. **Add development toggle**
   - [ ] Add dev-only mechanism to force platform for visual testing
   - [ ] Allow testing Windows/Linux layouts on macOS

**Windows CSS Requirement:**

```css
/* Required for drag regions to work with touch/pen on Windows */
*[data-tauri-drag-region] {
  app-region: drag;
}
```

**Acceptance Criteria:**

- [ ] macOS title bar unchanged in appearance and behavior
- [ ] Windows title bar renders with controls on right
- [ ] Linux toolbar renders without window controls
- [ ] Platform switching works (via dev toggle)
- [ ] Window dragging works on all variants

---

## Phase 3: Conditional Compilation & Configuration

**Goal:** Set up proper conditional compilation in Rust and platform-specific Tauri configs.

**Current State (from `tauri.conf.json`):**

```json
{
  "decorations": false,
  "transparent": true,
  "windowEffects": { "effects": ["hudWindow"], ... },
  "macOSPrivateApi": true
}
```

These are all macOS-specific and need to be moved/conditionally applied.

**Approach:**

- Base `tauri.conf.json` has safe cross-platform defaults
- Platform-specific configs override as needed:
  - `tauri.macos.conf.json` - decorations: false, transparent: true, macOSPrivateApi: true
  - `tauri.windows.conf.json` - decorations: false (custom title bar)
  - `tauri.linux.conf.json` - decorations: true (native chrome)

**Tasks:**

1. **Refactor base Tauri config**
   - [ ] Set safe defaults in `tauri.conf.json`: `decorations: true`, `transparent: false`
   - [ ] Remove macOS-specific settings from base config
   - [ ] Remove `windowEffects` from base (macOS only)

2. **Create platform-specific configs**
   - [ ] Create `tauri.macos.conf.json` with macOS settings
   - [ ] Create `tauri.windows.conf.json` with `decorations: false`
   - [ ] Create `tauri.linux.conf.json` with `decorations: true`

3. **Handle Rust conditional compilation**
   - [ ] Review `Cargo.toml` for any macOS-only features
   - [ ] Add `#[cfg(target_os = "...")]` where needed in Rust code
   - [ ] Ensure builds don't fail on other platforms

4. **Update capabilities if needed**
   - [ ] Verify `core:window:allow-start-dragging` is in capabilities
   - [ ] Add any other cross-platform window permissions

**Config Pattern:**

```json
// tauri.macos.conf.json
{
  "app": {
    "macOSPrivateApi": true,
    "windows": [
      {
        "decorations": false,
        "transparent": true,
        "windowEffects": {
          "effects": ["hudWindow"],
          "radius": 12.0,
          "state": "active"
        }
      }
    ]
  }
}
```

```json
// tauri.windows.conf.json
{
  "app": {
    "windows": [
      {
        "decorations": false
      }
    ]
  }
}
```

```json
// tauri.linux.conf.json
{
  "app": {
    "windows": [
      {
        "decorations": true
      }
    ]
  }
}
```

**Acceptance Criteria:**

- [ ] macOS build still works with vibrancy effects
- [ ] Configs merge correctly per platform
- [ ] No build failures from platform-specific code

---

## Phase 4: CI/Build System Setup

**Goal:** Configure GitHub Actions to build for all platforms.

**Current State:**

```yaml
matrix:
  include:
    - platform: 'macos-latest'
      args: '--bundles app,dmg'
```

Only builds for macOS.

**Tasks:**

1. **Update release workflow matrix**
   - [ ] Add Windows build (`windows-latest`)
   - [ ] Add Linux build (`ubuntu-22.04` or `ubuntu-latest`)
   - [ ] Configure platform-specific bundle arguments

2. **Add Linux dependencies step**
   - [ ] Install required Linux libraries (webkit2gtk, appindicator, etc.)

3. **Configure bundle settings**
   - [ ] Windows: MSI (no code signing for now)
   - [ ] Linux: AppImage
   - [ ] macOS: Keep current DMG setup

4. **Verify auto-updater works**
   - [ ] Confirm `includeUpdaterJson: true` is set (already present)
   - [ ] Verify `latest.json` includes all platform entries after build
   - [ ] Update release notes template with Windows/Linux instructions

5. **Test builds**
   - [ ] Trigger test build on feature branch
   - [ ] Verify all platform artifacts are produced
   - [ ] Verify `latest.json` contains entries for all platforms

**Workflow Pattern:**

```yaml
strategy:
  fail-fast: false
  matrix:
    include:
      - platform: 'macos-latest'
        args: '--bundles app,dmg'
      - platform: 'windows-latest'
        args: '--bundles msi'
      - platform: 'ubuntu-22.04'
        args: '--bundles appimage'

steps:
  - name: Install Linux dependencies
    if: matrix.platform == 'ubuntu-22.04'
    run: |
      sudo apt-get update
      sudo apt-get install -y libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

**Acceptance Criteria:**

- [ ] GitHub Actions produces Windows MSI artifact
- [ ] GitHub Actions produces Linux AppImage artifact
- [ ] macOS DMG release unchanged
- [ ] All builds complete successfully

---

## Phase 5: Path Handling Utilities

**Goal:** Add utilities for cross-platform path handling (primarily for future use).

**Note:** This template doesn't have complex path handling like Astro Editor, but we should establish patterns for apps built with it.

**Tasks:**

1. **Create Rust path utilities**
   - [ ] Create `src-tauri/src/utils/path.rs`
   - [ ] Add `normalize_path_for_serialization()` function
   - [ ] Document pattern for normalizing paths to forward slashes

2. **Document path handling patterns**
   - [ ] Add section to cross-platform docs
   - [ ] Note that Windows uses backslashes but frontend expects forward slashes
   - [ ] Provide examples for common operations

**Code Pattern:**

```rust
// src-tauri/src/utils/path.rs
use std::path::Path;

/// Normalizes a path to use forward slashes for consistent frontend handling.
/// Windows paths like `C:\Users\foo` become `C:/Users/foo`.
pub fn normalize_path_for_serialization(path: &Path) -> String {
    path.display().to_string().replace('\\', "/")
}
```

**Acceptance Criteria:**

- [ ] Path utility module exists
- [ ] Pattern documented for template users

---

## Phase 6: Documentation & Cleanup

**Goal:** Document cross-platform patterns and update existing docs.

**Tasks:**

1. **Create cross-platform documentation**
   - [ ] Create `docs/developer/cross-platform.md`
   - [ ] Document platform detection usage
   - [ ] Document conditional compilation patterns
   - [ ] Document Tauri config merging
   - [ ] Document title bar architecture

2. **Update existing documentation**
   - [ ] Update architecture guide with cross-platform notes
   - [ ] Update any title bar references
   - [ ] Review other docs for macOS-specific assumptions

3. **Update README**
   - [ ] Note that template supports macOS, Windows, Linux
   - [ ] Clarify that macOS is primary development target
   - [ ] Document how to build for each platform

4. **Final review**
   - [ ] Run `npm run check:all`
   - [ ] Manual testing on macOS
   - [ ] Code review for any missed platform assumptions

**Acceptance Criteria:**

- [ ] Cross-platform patterns documented
- [ ] README updated
- [ ] All checks pass
- [ ] macOS functionality verified

---

## Files Requiring Attention

### Title Bar Components

| File                                                | Action                                        |
| --------------------------------------------------- | --------------------------------------------- |
| `src/components/titlebar/TitleBar.tsx`              | Add platform detection, conditional rendering |
| `src/components/titlebar/MacOSWindowControls.tsx`   | Keep as-is, rename if needed                  |
| `src/components/titlebar/WindowsWindowControls.tsx` | **CREATE**                                    |
| `src/components/titlebar/LinuxTitleBar.tsx`         | **CREATE**                                    |
| `src/components/titlebar/TitleBarContent.tsx`       | **CREATE** - shared content                   |

### Configuration

| File                                | Action                                   |
| ----------------------------------- | ---------------------------------------- |
| `src-tauri/tauri.conf.json`         | Remove macOS-specific, set safe defaults |
| `src-tauri/tauri.macos.conf.json`   | **CREATE**                               |
| `src-tauri/tauri.windows.conf.json` | **CREATE**                               |
| `src-tauri/tauri.linux.conf.json`   | **CREATE**                               |
| `src-tauri/Cargo.toml`              | Review for conditional deps              |

### Utilities

| File                          | Action               |
| ----------------------------- | -------------------- |
| `src/hooks/use-platform.ts`   | **CREATE**           |
| `src/lib/platform-strings.ts` | **CREATE**           |
| `src-tauri/src/utils/path.rs` | **CREATE**           |
| `src-tauri/src/utils/mod.rs`  | **CREATE** or update |

### CI/Build

| File                            | Action                      |
| ------------------------------- | --------------------------- |
| `.github/workflows/release.yml` | Add Windows/Linux to matrix |

### Documentation

| File                                   | Action                           |
| -------------------------------------- | -------------------------------- |
| `docs/developer/cross-platform.md`     | **CREATE**                       |
| `docs/developer/architecture-guide.md` | Update with cross-platform notes |
| `README.md`                            | Update platform support info     |

---

## Out of Scope

The following are explicitly **not** included in this task:

- Windows code signing
- Linux package formats beyond AppImage (deb, rpm, etc.)
- Actual testing on Windows/Linux (separate follow-up tasks)
- IDE integration (not applicable to this template)
- Complex path handling beyond basic utilities

**Note:** Auto-updater _should_ work automatically for all platforms since `tauri-action` generates a cross-platform `latest.json` when `includeUpdaterJson: true` is set (already configured). We'll verify this during CI setup.

---

## Testing Strategy

Since we're developing on macOS:

1. **macOS:** Full manual testing
2. **Windows/Linux layouts:** Use dev toggle to visually verify
3. **Builds:** Verify via CI that artifacts are produced
4. **Actual Windows/Linux testing:** Separate future tasks

---

## Notes

- The `transform-gpu` CSS class may be needed for opacity transitions on Windows title bar (fixes WebKit rendering quirk)
- Linux has many desktop environments - native decorations are the safest approach
- Keep the implementation simple - this is a template, not a full application
