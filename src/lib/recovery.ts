import { logger } from '@/lib/logger'
import {
  commands,
  type JsonValue,
  type RecoveryError,
} from '@/lib/tauri-bindings'

/** Convert RecoveryError to a human-readable message */
function formatRecoveryError(error: RecoveryError): string {
  switch (error.type) {
    case 'FileNotFound':
      return 'File not found'
    case 'ValidationError':
      return `Validation error: ${error.message}`
    case 'DataTooLarge':
      return `Data too large (max ${error.max_bytes} bytes)`
    case 'IoError':
      return `IO error: ${error.message}`
    case 'ParseError':
      return `Parse error: ${error.message}`
  }
}

/**
 * Simple data recovery pattern for saving important data to disk
 *
 * Uses the same approach as preferences - JSON files in the app data directory
 * Files are saved to ~/Library/Application Support/[app]/recovery/
 */

export interface RecoveryOptions {
  /** Suppress error notifications (useful for background saves) */
  silent?: boolean
}

/**
 * Save any JSON-serializable data to a recovery file
 *
 * @param filename Base filename (without extension)
 * @param data Any JSON-serializable data
 * @param options Recovery options
 *
 * @example
 * ```typescript
 * // Save user draft
 * await saveEmergencyData('user-draft', { content: 'Hello world', timestamp: Date.now() })
 *
 * // Save app state before risky operation
 * await saveEmergencyData('app-state', { currentView: 'dashboard', unsavedChanges: true })
 * ```
 */
export async function saveEmergencyData(
  filename: string,
  data: JsonValue,
  options: RecoveryOptions = {}
): Promise<void> {
  logger.debug('Saving emergency data', { filename, dataType: typeof data })

  const result = await commands.saveEmergencyData(filename, data)

  if (result.status === 'error') {
    const message = formatRecoveryError(result.error)
    logger.error('Failed to save emergency data', {
      filename,
      error: result.error,
    })
    throw new Error(message)
  }

  if (!options.silent) {
    logger.info('Emergency data saved successfully', { filename })
  }
}

/**
 * Load data from a recovery file
 *
 * @param filename Base filename (without extension)
 * @returns The recovered data or null if file doesn't exist
 *
 * @example
 * ```typescript
 * // Load user draft
 * const draft = await loadEmergencyData('user-draft')
 * if (draft) {
 *   console.log('Found saved draft:', draft.content)
 * }
 * ```
 */
export async function loadEmergencyData<T = unknown>(
  filename: string
): Promise<T | null> {
  logger.debug('Loading emergency data', { filename })

  const result = await commands.loadEmergencyData(filename)

  if (result.status === 'error') {
    // FileNotFound is an expected case - return null instead of throwing
    if (result.error.type === 'FileNotFound') {
      logger.debug('Recovery file not found', { filename })
      return null
    }

    const message = formatRecoveryError(result.error)
    logger.error('Failed to load emergency data', {
      filename,
      error: result.error,
    })
    throw new Error(message)
  }

  logger.info('Emergency data loaded successfully', { filename })
  return result.data as T
}

/**
 * Clean up old recovery files (older than 7 days)
 * Called automatically on app startup
 *
 * @returns Number of files removed
 *
 * @example
 * ```typescript
 * const removedCount = await cleanupOldFiles()
 * console.log(`Cleaned up ${removedCount} old recovery files`)
 * ```
 */
export async function cleanupOldFiles(): Promise<number> {
  logger.debug('Starting recovery file cleanup')

  const result = await commands.cleanupOldRecoveryFiles()

  if (result.status === 'error') {
    const message = formatRecoveryError(result.error)
    logger.error('Failed to cleanup old recovery files', {
      error: result.error,
    })
    throw new Error(message)
  }

  const removedCount = result.data
  if (removedCount > 0) {
    logger.info('Cleaned up old recovery files', { removedCount })
  } else {
    logger.debug('No old recovery files to clean up')
  }

  return removedCount
}

/**
 * Save app state with timestamp for crash recovery
 * This is typically called by the error boundary
 *
 * @param state Current app state to save
 * @param crashInfo Optional crash information
 *
 * @example
 * ```typescript
 * // Save crash state in error boundary
 * await saveCrashState({
 *   currentPage: '/dashboard',
 *   userInput: formData,
 *   sessionId: 'abc123'
 * }, { error: error.message, stack: error.stack })
 * ```
 */
export async function saveCrashState(
  state: JsonValue,
  crashInfo?: { error?: string; stack?: string; componentStack?: string }
): Promise<void> {
  const timestamp = Date.now()
  const filename = `crash-${timestamp}`

  const crashData = {
    timestamp,
    state,
    crashInfo,
    userAgent: navigator.userAgent,
    url: window.location.href,
  }

  try {
    await saveEmergencyData(filename, crashData, { silent: true })
    logger.info('Crash state saved', { filename, timestamp })
  } catch (error) {
    // Don't throw from crash handler - just log
    logger.error('Failed to save crash state', { error })
  }
}
