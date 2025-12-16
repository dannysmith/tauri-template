import { load, type Store } from '@tauri-apps/plugin-store'

/**
 * App store for simple key-value persistence.
 *
 * Use this for:
 * - Recent files list
 * - UI state that should persist (collapsed panels, etc.)
 * - Feature flags
 * - Cached data
 *
 * For strongly-typed settings with validation, use the Preferences system instead.
 * See docs/developer/data-persistence.md for guidance on choosing between them.
 *
 * @example
 * ```typescript
 * import { getStore, getStoreValue, setStoreValue } from '@/lib/store';
 *
 * // Simple get/set
 * await setStoreValue('recentFiles', ['/path/to/file.txt']);
 * const files = await getStoreValue<string[]>('recentFiles', []);
 *
 * // Direct store access for advanced operations
 * const store = await getStore();
 * await store.delete('oldKey');
 * ```
 */

let storeInstance: Store | null = null

/**
 * Get the app store instance.
 * Creates/loads the store on first call, returns cached instance thereafter.
 * Store auto-saves with 100ms debounce - no need to call save() manually.
 */
export async function getStore(): Promise<Store> {
  if (!storeInstance) {
    // autoSave: true enables 100ms debounced auto-save
    // defaults: {} provides empty defaults (we handle defaults in getStoreValue)
    storeInstance = await load('app-data.json', {
      autoSave: true,
      defaults: {},
    })
  }
  return storeInstance
}

/**
 * Get a value from the store with a default fallback.
 */
export async function getStoreValue<T>(
  key: string,
  defaultValue: T
): Promise<T> {
  const store = await getStore()
  const value = await store.get<T>(key)
  return value ?? defaultValue
}

/**
 * Set a value in the store.
 * Auto-saves after 100ms debounce - no manual save needed.
 */
export async function setStoreValue<T>(key: string, value: T): Promise<void> {
  const store = await getStore()
  await store.set(key, value)
  // Note: Don't call save() - autoSave handles it with debouncing
}

/**
 * Delete a key from the store.
 */
export async function deleteStoreValue(key: string): Promise<void> {
  const store = await getStore()
  await store.delete(key)
}

/**
 * Check if a key exists in the store.
 */
export async function hasStoreValue(key: string): Promise<boolean> {
  const store = await getStore()
  return store.has(key)
}

/**
 * Get all keys in the store.
 */
export async function getStoreKeys(): Promise<string[]> {
  const store = await getStore()
  return store.keys()
}

/**
 * Clear all data from the store.
 * Use with caution - this deletes everything.
 */
export async function clearStore(): Promise<void> {
  const store = await getStore()
  await store.clear()
}
