import { platform, type Platform } from '@tauri-apps/plugin-os'
import { logger } from '@/lib/logger'

/**
 * Supported desktop platforms for this template.
 * Other platforms (iOS, Android) are not supported.
 */
export type AppPlatform = 'macos' | 'windows' | 'linux'

// Module-level cache for platform detection
let cachedPlatform: AppPlatform | null = null

/**
 * Reset the platform cache.
 * Only exported for testing purposes - allows tests to simulate different platforms.
 * @internal
 */
export function __resetPlatformCache(): void {
  cachedPlatform = null
}

/**
 * Maps the Tauri platform string to our supported platform types.
 * Linux and any other Unix-like systems are treated as 'linux'.
 */
function mapPlatform(p: Platform): AppPlatform {
  if (p === 'macos') return 'macos'
  if (p === 'windows') return 'windows'
  return 'linux'
}

/**
 * Initialize platform detection.
 * Called on first access and caches the result.
 */
function initPlatform(): AppPlatform {
  if (cachedPlatform === null) {
    try {
      cachedPlatform = mapPlatform(platform())
    } catch {
      // Fallback if platform() fails (e.g., in non-Tauri environment during tests)
      logger.warn('Platform detection failed, defaulting to macOS')
      cachedPlatform = 'macos'
    }
  }
  return cachedPlatform
}

/**
 * Synchronously get the current platform.
 * Use this in non-hook contexts (event handlers, callbacks).
 * Results are cached for performance.
 *
 * @example
 * const currentPlatform = getPlatform()
 * if (currentPlatform === 'windows') {
 *   // Windows-specific logic
 * }
 */
export function getPlatform(): AppPlatform {
  return initPlatform()
}

/**
 * React hook to get the current platform.
 *
 * The platform is detected synchronously and cached, so this hook
 * always returns a value immediately (no loading state).
 *
 * @example
 * const platform = usePlatform()
 * if (platform === 'macos') {
 *   // Render macOS-specific UI
 * }
 */
export function usePlatform(): AppPlatform {
  // Platform is constant - just return the cached value
  return initPlatform()
}

/**
 * Check if the current platform is macOS.
 * Convenience hook for platform-specific rendering.
 */
export function useIsMacOS(): boolean {
  return usePlatform() === 'macos'
}

/**
 * Check if the current platform is Windows.
 * Convenience hook for platform-specific rendering.
 */
export function useIsWindows(): boolean {
  return usePlatform() === 'windows'
}

/**
 * Check if the current platform is Linux.
 * Convenience hook for platform-specific rendering.
 */
export function useIsLinux(): boolean {
  return usePlatform() === 'linux'
}
