import type { AppPlatform } from '@/hooks/use-platform'

/**
 * Platform-specific UI strings.
 * Maps platform-agnostic actions to platform-specific labels.
 */
export interface PlatformStrings {
  /** Label for revealing a file in the file manager */
  revealInFileManager: string
  /** Name of the platform's file manager */
  fileManagerName: string
  /** Modifier key name (Cmd on macOS, Ctrl elsewhere) */
  modifierKey: string
  /** Modifier key symbol for keyboard shortcuts */
  modifierKeySymbol: string
  /** Option/Alt key name */
  optionKey: string
  /** Option/Alt key symbol */
  optionKeySymbol: string
  /** Preferences/Settings label */
  preferencesLabel: string
  /** Quit/Exit application label */
  quitLabel: string
  /** Trash/Recycle Bin name */
  trashName: string
}

const macOSStrings: PlatformStrings = {
  revealInFileManager: 'Reveal in Finder',
  fileManagerName: 'Finder',
  modifierKey: 'Cmd',
  modifierKeySymbol: '⌘',
  optionKey: 'Option',
  optionKeySymbol: '⌥',
  preferencesLabel: 'Preferences',
  quitLabel: 'Quit',
  trashName: 'Trash',
}

const windowsStrings: PlatformStrings = {
  revealInFileManager: 'Show in Explorer',
  fileManagerName: 'Explorer',
  modifierKey: 'Ctrl',
  modifierKeySymbol: 'Ctrl',
  optionKey: 'Alt',
  optionKeySymbol: 'Alt',
  preferencesLabel: 'Settings',
  quitLabel: 'Exit',
  trashName: 'Recycle Bin',
}

const linuxStrings: PlatformStrings = {
  revealInFileManager: 'Show in Files',
  fileManagerName: 'Files',
  modifierKey: 'Ctrl',
  modifierKeySymbol: 'Ctrl',
  optionKey: 'Alt',
  optionKeySymbol: 'Alt',
  preferencesLabel: 'Preferences',
  quitLabel: 'Quit',
  trashName: 'Trash',
}

/**
 * Get platform-specific strings for UI labels.
 *
 * @param platform - The current platform, or undefined for defaults (macOS)
 * @returns Platform-specific string mappings
 *
 * @example
 * const platform = usePlatform()
 * const strings = getPlatformStrings(platform)
 * // strings.revealInFileManager === 'Reveal in Finder' on macOS
 */
export function getPlatformStrings(
  platform: AppPlatform | undefined
): PlatformStrings {
  switch (platform) {
    case 'windows':
      return windowsStrings
    case 'linux':
      return linuxStrings
    case 'macos':
    default:
      // Default to macOS strings while platform is being detected
      return macOSStrings
  }
}

/**
 * Format a keyboard shortcut for display.
 *
 * @param platform - The current platform
 * @param key - The key (e.g., 'K', 'S', 'Enter', 'F1')
 * @param modifiers - Modifiers to include ('mod' for Cmd/Ctrl, 'shift', 'alt')
 * @returns Formatted shortcut string (e.g., '⌘K' or 'Ctrl+K')
 *
 * @example
 * formatShortcut('macos', 'K') // '⌘K'
 * formatShortcut('windows', 'K') // 'Ctrl+K'
 * formatShortcut('macos', 'K', ['shift', 'mod']) // '⇧⌘K'
 * formatShortcut('macos', 'F1', []) // 'F1' (no modifier)
 * formatShortcut('macos', 'Escape', []) // 'Escape'
 */
export function formatShortcut(
  platform: AppPlatform | undefined,
  key: string,
  modifiers: ('mod' | 'shift' | 'alt')[] = ['mod']
): string {
  // Normalize platform to match getPlatformStrings default behavior
  const normalizedPlatform: AppPlatform = platform ?? 'macos'
  const strings = getPlatformStrings(normalizedPlatform)
  const isMac = normalizedPlatform === 'macos'
  const parts: string[] = []

  if (modifiers.includes('shift')) {
    parts.push(isMac ? '⇧' : 'Shift+')
  }

  if (modifiers.includes('alt')) {
    parts.push(isMac ? strings.optionKeySymbol : 'Alt+')
  }

  if (modifiers.includes('mod')) {
    parts.push(strings.modifierKeySymbol)
    if (!isMac) {
      parts.push('+')
    }
  }

  parts.push(key)

  return parts.join('')
}
