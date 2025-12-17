import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock the Tauri menu API
const mockPopup = vi.fn().mockResolvedValue(undefined)
const mockMenuNew = vi.fn().mockResolvedValue({ popup: mockPopup })
const mockMenuItemNew = vi.fn().mockResolvedValue({})
const mockPredefinedMenuItemNew = vi.fn().mockResolvedValue({})

vi.mock('@tauri-apps/api/menu', () => ({
  Menu: {
    new: mockMenuNew,
  },
  MenuItem: {
    new: mockMenuItemNew,
  },
  PredefinedMenuItem: {
    new: mockPredefinedMenuItemNew,
  },
}))

describe('context-menu utilities', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should export all utility functions', async () => {
    const module = await import('./context-menu')
    expect(module.showContextMenu).toBeDefined()
    expect(module.showEditContextMenu).toBeDefined()
    expect(module.showTextInputContextMenu).toBeDefined()
  })

  it('showContextMenu should create menu items and show popup', async () => {
    const { showContextMenu } = await import('./context-menu')

    const action = vi.fn()
    await showContextMenu([
      { id: 'test', label: 'Test Item', action },
      { type: 'separator' },
      { id: 'disabled', label: 'Disabled', disabled: true },
      { id: 'shortcut', label: 'With Shortcut', accelerator: 'CmdOrCtrl+K' },
    ])

    // Should create MenuItem for regular items
    expect(mockMenuItemNew).toHaveBeenCalledWith({
      id: 'test',
      text: 'Test Item',
      accelerator: undefined,
      enabled: true,
      action,
    })

    // Should create PredefinedMenuItem for separator
    expect(mockPredefinedMenuItemNew).toHaveBeenCalledWith({
      item: 'Separator',
    })

    // Should create disabled MenuItem
    expect(mockMenuItemNew).toHaveBeenCalledWith({
      id: 'disabled',
      text: 'Disabled',
      accelerator: undefined,
      enabled: false,
      action: undefined,
    })

    // Should pass accelerator through
    expect(mockMenuItemNew).toHaveBeenCalledWith({
      id: 'shortcut',
      text: 'With Shortcut',
      accelerator: 'CmdOrCtrl+K',
      enabled: true,
      action: undefined,
    })

    // Should create menu and show popup
    expect(mockMenuNew).toHaveBeenCalled()
    expect(mockPopup).toHaveBeenCalled()
  })

  it('showEditContextMenu should create standard edit menu', async () => {
    const { showEditContextMenu } = await import('./context-menu')

    await showEditContextMenu()

    // Should create Cut, Copy, Paste, Separator, SelectAll
    expect(mockPredefinedMenuItemNew).toHaveBeenCalledWith({ item: 'Cut' })
    expect(mockPredefinedMenuItemNew).toHaveBeenCalledWith({ item: 'Copy' })
    expect(mockPredefinedMenuItemNew).toHaveBeenCalledWith({ item: 'Paste' })
    expect(mockPredefinedMenuItemNew).toHaveBeenCalledWith({
      item: 'Separator',
    })
    expect(mockPredefinedMenuItemNew).toHaveBeenCalledWith({
      item: 'SelectAll',
    })
    expect(mockPopup).toHaveBeenCalled()
  })

  it('showTextInputContextMenu should include Undo/Redo', async () => {
    const { showTextInputContextMenu } = await import('./context-menu')

    await showTextInputContextMenu()

    // Should include Undo and Redo
    expect(mockPredefinedMenuItemNew).toHaveBeenCalledWith({ item: 'Undo' })
    expect(mockPredefinedMenuItemNew).toHaveBeenCalledWith({ item: 'Redo' })
    expect(mockPopup).toHaveBeenCalled()
  })
})
