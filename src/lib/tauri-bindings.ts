/**
 * Re-export generated Tauri bindings with project conventions
 *
 * This file provides type-safe access to all Tauri commands.
 * Types are auto-generated from Rust by tauri-specta.
 *
 * @example
 * ```typescript
 * import { commands, type AppPreferences } from '@/lib/tauri-bindings'
 *
 * const result = await commands.loadPreferences()
 * if (result.status === 'ok') {
 *   console.log(result.data.theme)
 * }
 * ```
 */

export { commands, type Result } from './bindings'
export type { AppPreferences, JsonValue } from './bindings'

/**
 * Helper to unwrap a Result type, throwing on error
 */
export function unwrapResult<T, E>(result: {
  status: 'ok' | 'error'
  data?: T
  error?: E
}): T {
  if (result.status === 'ok') {
    return result.data as T
  }
  throw result.error
}
