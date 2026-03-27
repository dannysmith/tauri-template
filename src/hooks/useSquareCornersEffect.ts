import { useEffect } from 'react'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { useUIStore } from '@/store/ui-store'
import { usePlatform } from './use-platform'

/**
 * Manages square corners based on platform and fullscreen state.
 *
 * Rules:
 * - macOS: always rounded (OS handles window corners)
 * - Windows: square when fullscreen (no rounded corners needed at screen edge)
 * - Linux: square when fullscreen
 */
export function useSquareCornersEffect() {
  const platform = usePlatform()
  const setSquareCorners = useUIStore(state => state.setSquareCorners)

  useEffect(() => {
    // macOS always has rounded corners via windowEffects
    if (platform === 'macos') {
      setSquareCorners(false)
      return
    }

    let cancelled = false
    const window = getCurrentWindow()

    const updateCorners = async () => {
      const isFullscreen = await window.isFullscreen()
      if (cancelled) return
      // Windows/Linux: square corners only in fullscreen
      setSquareCorners(isFullscreen)
    }

    // Check initial state
    void updateCorners()

    // Listen for window state changes
    const unlisten = window.onResized(() => {
      if (cancelled) return
      void updateCorners()
    })

    return () => {
      cancelled = true
      void unlisten.then(fn => fn())
    }
  }, [platform, setSquareCorners])
}
