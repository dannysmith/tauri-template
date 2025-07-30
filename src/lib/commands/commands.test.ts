import { describe, it, expect, beforeEach, vi } from 'vitest'
import type { CommandContext, AppCommand } from '@/types/commands'

const mockUIStore = {
  getState: vi.fn(() => ({
    sidebarVisible: true,
    commandPaletteOpen: false,
    setSidebarVisible: vi.fn(),
  })),
}

vi.mock('@/store/ui-store', () => ({
  useUIStore: mockUIStore,
}))

const { registerCommands, getAllCommands, executeCommand } = await import(
  './registry'
)
const { navigationCommands } = await import('./navigation-commands')

const createMockContext = (): CommandContext => ({
  toggleSidebar: vi.fn(),
  toggleCommandPalette: vi.fn(),
  openPreferences: vi.fn(),
  showToast: vi.fn(),
})

describe('Simplified Command System', () => {
  let mockContext: CommandContext

  beforeEach(() => {
    mockContext = createMockContext()
    registerCommands(navigationCommands)
  })

  describe('Command Registration', () => {
    it('registers commands correctly', () => {
      const commands = getAllCommands(mockContext)
      expect(commands.length).toBeGreaterThan(0)

      const sidebarCommand = commands.find(cmd => cmd.id === 'toggle-sidebar')
      expect(sidebarCommand).toBeDefined()
      expect(sidebarCommand?.label).toBe('Toggle Sidebar')
    })

    it('filters commands by availability', () => {
      mockUIStore.getState.mockReturnValue({
        sidebarVisible: false,
        commandPaletteOpen: false,
        setSidebarVisible: vi.fn(),
      })

      const availableCommands = getAllCommands(mockContext)
      const showSidebarCommand = availableCommands.find(
        cmd => cmd.id === 'show-sidebar'
      )
      const hideSidebarCommand = availableCommands.find(
        cmd => cmd.id === 'hide-sidebar'
      )

      expect(showSidebarCommand).toBeDefined()
      expect(hideSidebarCommand).toBeUndefined()
    })

    it('filters commands by search term', () => {
      const searchResults = getAllCommands(mockContext, 'sidebar')

      expect(searchResults.length).toBeGreaterThan(0)
      searchResults.forEach(cmd => {
        const matchesSearch =
          cmd.label.toLowerCase().includes('sidebar') ||
          cmd.description?.toLowerCase().includes('sidebar')

        expect(matchesSearch).toBe(true)
      })
    })
  })

  describe('Command Execution', () => {
    it('executes toggle-sidebar command correctly', async () => {
      const result = await executeCommand('toggle-sidebar', mockContext)

      expect(result.success).toBe(true)
      expect(mockContext.toggleSidebar).toHaveBeenCalled()
      expect(mockContext.showToast).toHaveBeenCalledWith(
        expect.stringContaining('Sidebar'),
        'success'
      )
    })

    it('executes show-sidebar command when available', async () => {
      mockUIStore.getState.mockReturnValue({
        sidebarVisible: false,
        commandPaletteOpen: false,
        setSidebarVisible: vi.fn(),
      })

      const result = await executeCommand('show-sidebar', mockContext)

      expect(result.success).toBe(true)
      expect(mockContext.showToast).toHaveBeenCalledWith(
        'Sidebar shown',
        'success'
      )
    })

    it('fails to execute unavailable command', async () => {
      mockUIStore.getState.mockReturnValue({
        sidebarVisible: true,
        commandPaletteOpen: false,
        setSidebarVisible: vi.fn(),
      })

      const result = await executeCommand('show-sidebar', mockContext)

      expect(result.success).toBe(false)
      expect(result.error).toContain('not available')
    })

    it('handles non-existent command', async () => {
      const result = await executeCommand('non-existent-command', mockContext)

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    it('handles command execution errors', async () => {
      const errorCommand: AppCommand = {
        id: 'error-command',
        label: 'Error Command',
        execute: () => {
          throw new Error('Test error')
        },
      }

      registerCommands([errorCommand])

      const result = await executeCommand('error-command', mockContext)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Test error')
    })
  })
})
