import { Menu, MenuItem, PredefinedMenuItem } from '@tauri-apps/api/menu'

/**
 * Context menu utilities for native right-click menus.
 *
 * Uses Tauri's built-in Menu API (no plugin required).
 *
 * @example
 * ```typescript
 * // Custom context menu
 * await showContextMenu([
 *   { id: 'copy', label: 'Copy', accelerator: 'CmdOrCtrl+C', action: handleCopy },
 *   { type: 'separator' },
 *   { id: 'delete', label: 'Delete', action: handleDelete },
 * ]);
 *
 * // Standard edit menu (Cut, Copy, Paste, Select All)
 * await showEditContextMenu();
 *
 * // Text input menu with Undo/Redo
 * await showTextInputContextMenu();
 * ```
 */

export interface ContextMenuItem {
  id: string
  label: string
  accelerator?: string
  disabled?: boolean
  action?: () => void
}

export interface ContextMenuSeparator {
  type: 'separator'
}

export type ContextMenuEntry = ContextMenuItem | ContextMenuSeparator

/**
 * Type guard to check if an entry is a separator.
 */
function isSeparator(item: ContextMenuEntry): item is ContextMenuSeparator {
  return 'type' in item && item.type === 'separator'
}

/**
 * Show a custom context menu at the current cursor position.
 */
export async function showContextMenu(
  items: ContextMenuEntry[]
): Promise<void> {
  const menuItems = await Promise.all(
    items.map(async item => {
      if (isSeparator(item)) {
        return PredefinedMenuItem.new({ item: 'Separator' })
      }
      return MenuItem.new({
        id: item.id,
        text: item.label,
        accelerator: item.accelerator,
        enabled: !item.disabled,
        action: item.action,
      })
    })
  )

  const menu = await Menu.new({ items: menuItems })
  await menu.popup()
}

/**
 * Show a standard edit context menu with Cut, Copy, Paste, Select All.
 * Uses native predefined menu items that work with the system clipboard.
 */
export async function showEditContextMenu(): Promise<void> {
  const menu = await Menu.new({
    items: [
      await PredefinedMenuItem.new({ item: 'Cut' }),
      await PredefinedMenuItem.new({ item: 'Copy' }),
      await PredefinedMenuItem.new({ item: 'Paste' }),
      await PredefinedMenuItem.new({ item: 'Separator' }),
      await PredefinedMenuItem.new({ item: 'SelectAll' }),
    ],
  })
  await menu.popup()
}

/**
 * Show a context menu for text input fields.
 * Includes Undo/Redo in addition to standard edit operations.
 */
export async function showTextInputContextMenu(): Promise<void> {
  const menu = await Menu.new({
    items: [
      await PredefinedMenuItem.new({ item: 'Undo' }),
      await PredefinedMenuItem.new({ item: 'Redo' }),
      await PredefinedMenuItem.new({ item: 'Separator' }),
      await PredefinedMenuItem.new({ item: 'Cut' }),
      await PredefinedMenuItem.new({ item: 'Copy' }),
      await PredefinedMenuItem.new({ item: 'Paste' }),
      await PredefinedMenuItem.new({ item: 'Separator' }),
      await PredefinedMenuItem.new({ item: 'SelectAll' }),
    ],
  })
  await menu.popup()
}
