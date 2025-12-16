import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Tauri store plugin
vi.mock('@tauri-apps/plugin-store', () => {
  const mockStore = {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
    has: vi.fn(),
    keys: vi.fn(),
    clear: vi.fn(),
  }
  return {
    load: vi.fn().mockResolvedValue(mockStore),
    Store: vi.fn(),
  }
})

describe('store utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset the cached store instance by re-importing
    vi.resetModules()
  })

  it('should export all utility functions', async () => {
    const module = await import('./store')
    expect(module.getStore).toBeDefined()
    expect(module.getStoreValue).toBeDefined()
    expect(module.setStoreValue).toBeDefined()
    expect(module.deleteStoreValue).toBeDefined()
    expect(module.hasStoreValue).toBeDefined()
    expect(module.getStoreKeys).toBeDefined()
    expect(module.clearStore).toBeDefined()
  })

  it('should create store with correct options', async () => {
    const { load } = await import('@tauri-apps/plugin-store')
    const { getStore } = await import('./store')

    await getStore()

    expect(load).toHaveBeenCalledWith('app-data.json', {
      autoSave: true,
      defaults: {},
    })
  })

  it('should cache store instance', async () => {
    const { load } = await import('@tauri-apps/plugin-store')
    const { getStore } = await import('./store')

    await getStore()
    await getStore()

    // Should only create once
    expect(load).toHaveBeenCalledTimes(1)
  })

  it('getStoreValue should return default when key not found', async () => {
    const { load } = await import('@tauri-apps/plugin-store')
    const mockStore = { get: vi.fn().mockResolvedValue(undefined) }
    vi.mocked(load).mockResolvedValue(mockStore as never)

    const { getStoreValue } = await import('./store')
    const result = await getStoreValue('nonexistent', 'default-value')

    expect(result).toBe('default-value')
  })

  it('getStoreValue should return stored value when found', async () => {
    const { load } = await import('@tauri-apps/plugin-store')
    const mockStore = { get: vi.fn().mockResolvedValue('stored-value') }
    vi.mocked(load).mockResolvedValue(mockStore as never)

    const { getStoreValue } = await import('./store')
    const result = await getStoreValue('existing', 'default-value')

    expect(result).toBe('stored-value')
  })
})
