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

## Phase 1: Platform Detection Utilities ✅ COMPLETE

**Goal:** Create reusable platform detection for React components and Rust code.

**Current State:**

- No platform detection exists in frontend
- `use-mobile.ts` only checks viewport width, not OS
- No Rust-side platform utilities

**Prerequisites:**

- `@tauri-apps/plugin-os` is already available in Tauri v2

**Tasks:**

1. **Install OS plugin**
   - [x] Add `tauri-plugin-os` to Cargo.toml
   - [x] Initialize plugin in `lib.rs`
   - [x] Install `@tauri-apps/plugin-os` npm package
   - [x] Add `os:default` permission to capabilities

2. **Create platform detection hook**
   - [x] Create `src/hooks/use-platform.ts`
   - [x] Export `usePlatform()` hook returning `'macos' | 'windows' | 'linux'`
   - [x] Export `getPlatform()` function for non-hook contexts
   - [x] Add convenience hooks: `useIsMacOS()`, `useIsWindows()`, `useIsLinux()`

3. **Create platform-specific strings utility**
   - [x] Create `src/lib/platform-strings.ts`
   - [x] Map platform to UI strings (e.g., "Reveal in Finder" vs "Show in Explorer")
   - [x] Add `formatShortcut()` helper for platform-aware keyboard shortcut display

4. **Create Rust platform helpers**
   - [x] Create `src-tauri/src/utils/platform.rs`
   - [x] Add `normalize_path_for_serialization()` function
   - [x] Add platform detection helpers (`is_macos()`, `is_windows()`, `is_linux()`, `current_platform()`)
   - [x] Add `#[cfg(target_os = "...")]` patterns in documentation

**Implementation Notes:**

The `platform()` function from `@tauri-apps/plugin-os` is **synchronous** (not async as originally documented). The actual implementation:

```typescript
// src/hooks/use-platform.ts
import { platform, type Platform } from '@tauri-apps/plugin-os'

export type AppPlatform = 'macos' | 'windows' | 'linux'

function mapPlatform(p: Platform): AppPlatform {
  if (p === 'macos') return 'macos'
  if (p === 'windows') return 'windows'
  return 'linux'
}

export function usePlatform(): AppPlatform {
  // Platform is synchronous and cached
  return mapPlatform(platform())
}

export function getPlatform(): AppPlatform {
  return mapPlatform(platform())
}
```

**Acceptance Criteria:**

- [x] `usePlatform()` hook works on macOS (returns 'macos')
- [x] Pattern documented for future use
- [x] No breaking changes to existing functionality
- [x] All checks pass (`npm run check:all`)

---

## Phase 2: Title Bar Refactoring ✅ COMPLETE

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
   - [x] Identify shared title bar content (toolbar items, title text)
   - [x] Create `TitleBarContent.tsx` with composable pieces:
     - `TitleBarLeftActions` - left toolbar buttons
     - `TitleBarRightActions` - right toolbar buttons
     - `TitleBarTitle` - centered title
   - [x] Ensure macOS version still works identically after extraction

2. **Create Windows title bar**
   - [x] Create `WindowsWindowControls.tsx` with controls on RIGHT
   - [x] Use Windows-style icons (minimize line, maximize square, close X)
   - [x] Wire up minimize/maximize/close to Tauri window API
   - [x] Apply `data-tauri-drag-region` for dragging

3. **Create Linux toolbar**
   - [x] Create `LinuxTitleBar.tsx` as toolbar only (no window controls)
   - [x] Styled to work below native window decorations
   - [x] Include same toolbar items as other platforms

4. **Create platform wrapper**
   - [x] Update `TitleBar.tsx` to use `usePlatform()`
   - [x] Conditionally render correct component per platform
   - [x] No loading state needed (platform detection is synchronous)

5. **Add development toggle**
   - [x] Add `forcePlatform` prop to `TitleBar` for dev testing
   - [x] Only works when `import.meta.env.DEV` is true

**Windows CSS Requirement:**

```css
/* Required for drag regions to work with touch/pen on Windows */
*[data-tauri-drag-region] {
  app-region: drag;
}
```

**Acceptance Criteria:**

- [x] macOS title bar unchanged in appearance and behavior
- [x] Windows title bar renders with controls on right
- [x] Linux toolbar renders without window controls
- [x] Platform switching works (via `forcePlatform` prop in dev)
- [ ] Window dragging works on all variants (needs manual testing)
- [x] All checks pass (`npm run check:all`)

---

## Phase 3: Conditional Compilation & Configuration ✅ COMPLETE

**Goal:** Set up proper conditional compilation in Rust and platform-specific Tauri configs.

**Approach:**

Tauri v2 **automatically merges** platform-specific config files using [JSON Merge Patch (RFC 7396)](https://datatracker.ietf.org/doc/html/rfc7396).

**CRITICAL LEARNING:** JSON Merge Patch **replaces arrays entirely**, not element-by-element. This means each platform-specific config must include the **COMPLETE** `windows` array with all properties, not just overrides.

**Tasks:**

1. **Refactor base Tauri config**
   - [x] Set safe defaults in `tauri.conf.json`: `decorations: true`, `transparent: false`
   - [x] Remove macOS-specific settings from base config (windowEffects)
   - [x] Keep `macOSPrivateApi: true` in base (required for Cargo feature validation, harmless on other platforms)

2. **Create platform-specific configs**
   - [x] Create `tauri.macos.conf.json` with COMPLETE windows array + macOS settings
   - [x] Create `tauri.windows.conf.json` with COMPLETE windows array + decorations: false
   - [x] Create `tauri.linux.conf.json` with COMPLETE windows array + decorations: true

3. **Handle Rust conditional compilation**
   - [x] Review `Cargo.toml` - `macos-private-api` feature is safe on all platforms
   - [x] Existing `#[cfg(target_os = "macos")]` in lib.rs for logging is correct
   - [x] Builds work on all platforms

4. **Update capabilities if needed**
   - [x] Verified `core:window:allow-start-dragging` is in capabilities
   - [x] All required window permissions already present

**Acceptance Criteria:**

- [x] macOS build still works with vibrancy effects
- [x] Configs merge correctly per platform
- [x] No build failures from platform-specific code

---

## Phase 4: CI/Build System Setup ✅ COMPLETE

**Goal:** Configure GitHub Actions to build for all platforms.

**Tasks:**

1. **Update release workflow matrix**
   - [x] Add Windows build (`windows-latest`)
   - [x] Add Linux build (`ubuntu-22.04`)
   - [x] Configure platform-specific bundle arguments

2. **Add Linux dependencies step**
   - [x] Install required Linux libraries (libwebkit2gtk-4.1-dev, libappindicator3-dev, librsvg2-dev, patchelf)

3. **Configure bundle settings**
   - [x] Windows: MSI (no code signing)
   - [x] Linux: AppImage
   - [x] macOS: DMG (unchanged)

4. **Verify auto-updater works**
   - [x] `includeUpdaterJson: true` is set
   - [x] Update release notes template with Windows/Linux instructions
   - Note: `latest.json` generation requires `TAURI_SIGNING_PRIVATE_KEY` to be set by template users

5. **Test builds**
   - [x] Triggered test build - all platforms compile successfully
   - [x] Signing step fails without keys (expected for template)
   - [x] Artifacts are produced before signing step

**Acceptance Criteria:**

- [x] GitHub Actions produces Windows MSI artifact (before signing)
- [x] GitHub Actions produces Linux AppImage artifact (before signing)
- [x] macOS DMG release unchanged
- [x] All builds compile successfully (signing requires user's keys)

---

## Phase 5: Path Handling Utilities ✅ COMPLETE (merged into Phase 1)

**Goal:** Add utilities for cross-platform path handling (primarily for future use).

**Note:** This was merged into Phase 1. The `normalize_path_for_serialization()` function was added to `src-tauri/src/utils/platform.rs`.

**Tasks:**

1. **Create Rust path utilities**
   - [x] Create `src-tauri/src/utils/platform.rs` (combined with platform detection)
   - [x] Add `normalize_path_for_serialization()` function
   - [x] Document pattern for normalizing paths to forward slashes

2. **Document path handling patterns**
   - [ ] Add section to cross-platform docs
   - [ ] Note that Windows uses backslashes but frontend expects forward slashes
   - [ ] Provide examples for common operations

**Acceptance Criteria:**

- [x] Path utility module exists
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

| File                                                | Status       |
| --------------------------------------------------- | ------------ |
| `src/components/titlebar/TitleBar.tsx`              | ✅ Updated   |
| `src/components/titlebar/MacOSWindowControls.tsx`   | ✅ Unchanged |
| `src/components/titlebar/WindowsWindowControls.tsx` | ✅ Created   |
| `src/components/titlebar/LinuxTitleBar.tsx`         | ✅ Created   |
| `src/components/titlebar/TitleBarContent.tsx`       | ✅ Created   |

### Configuration

| File                                | Status                         |
| ----------------------------------- | ------------------------------ |
| `src-tauri/tauri.conf.json`         | ✅ Updated                     |
| `src-tauri/tauri.macos.conf.json`   | ✅ Created                     |
| `src-tauri/tauri.windows.conf.json` | ✅ Created                     |
| `src-tauri/tauri.linux.conf.json`   | ✅ Created                     |
| `src-tauri/Cargo.toml`              | ✅ Unchanged (already correct) |

### Utilities

| File                              | Status     |
| --------------------------------- | ---------- |
| `src/hooks/use-platform.ts`       | ✅ Created |
| `src/lib/platform-strings.ts`     | ✅ Created |
| `src-tauri/src/utils/platform.rs` | ✅ Created |
| `src-tauri/src/utils/mod.rs`      | ✅ Created |

### CI/Build

| File                            | Status     |
| ------------------------------- | ---------- |
| `.github/workflows/release.yml` | ✅ Updated |

### Documentation

| File                                   | Status     |
| -------------------------------------- | ---------- |
| `docs/developer/cross-platform.md`     | ⏳ Pending |
| `docs/developer/architecture-guide.md` | ⏳ Pending |
| `README.md`                            | ⏳ Pending |

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
2. **Windows/Linux layouts:** Use `forcePlatform` prop to visually verify
3. **Builds:** Verify via CI that artifacts are produced
4. **Actual Windows/Linux testing:** Separate future tasks

---

## Notes

- The `transform-gpu` CSS class may be needed for opacity transitions on Windows title bar (fixes WebKit rendering quirk)
- Linux has many desktop environments - native decorations are the safest approach
- Keep the implementation simple - this is a template, not a full application
- Platform-specific configs are automatically merged by Tauri v2 - no CLI flags needed
