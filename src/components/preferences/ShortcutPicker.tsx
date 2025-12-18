import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { getPlatform } from '@/hooks/use-platform'

interface ShortcutPickerProps {
  value: string | null
  defaultValue: string
  onChange: (shortcut: string | null) => void
  disabled?: boolean
  className?: string
}

/**
 * Formats a shortcut string for display with nice symbols.
 * Converts "CommandOrControl+Shift+." to "⌘⇧." on macOS or "Ctrl+Shift+." on other platforms.
 */
function formatShortcutForDisplay(shortcut: string): string {
  const isMac = getPlatform() === 'macos'

  let formatted = shortcut
    // Handle CommandOrControl first
    .replace(/CommandOrControl/gi, isMac ? '⌘' : 'Ctrl')
    .replace(/CmdOrCtrl/gi, isMac ? '⌘' : 'Ctrl')
    // Then handle individual modifiers
    .replace(/Command/gi, '⌘')
    .replace(/Control/gi, isMac ? '⌃' : 'Ctrl')
    .replace(/Ctrl/gi, isMac ? '⌃' : 'Ctrl')
    .replace(/Shift/gi, isMac ? '⇧' : 'Shift')
    .replace(/Alt/gi, isMac ? '⌥' : 'Alt')
    .replace(/Super/gi, isMac ? '⌘' : 'Win')
    // Handle common key names
    .replace(/Period/gi, '.')
    .replace(/Comma/gi, ',')
    .replace(/Slash/gi, '/')
    .replace(/Backslash/gi, '\\')
    .replace(/BracketLeft/gi, '[')
    .replace(/BracketRight/gi, ']')
    .replace(/Semicolon/gi, ';')
    .replace(/Quote/gi, "'")
    .replace(/Backquote/gi, '`')
    .replace(/Minus/gi, '-')
    .replace(/Equal/gi, '=')
    .replace(/Space/gi, 'Space')
    .replace(/Enter/gi, '↵')
    .replace(/Escape/gi, 'Esc')
    .replace(/Backspace/gi, '⌫')
    .replace(/Delete/gi, '⌦')
    .replace(/ArrowUp/gi, '↑')
    .replace(/ArrowDown/gi, '↓')
    .replace(/ArrowLeft/gi, '←')
    .replace(/ArrowRight/gi, '→')
    .replace(/Tab/gi, '⇥')

  // On Mac, join with no separator for modifier symbols
  if (isMac) {
    // Replace + between symbols with nothing for compact display
    formatted = formatted.replace(/\+/g, '')
  }

  return formatted
}

/**
 * Converts a KeyboardEvent to a shortcut string format that Tauri understands.
 * Returns null if no valid shortcut (e.g., just a modifier key).
 */
function keyEventToShortcut(e: KeyboardEvent): string | null {
  // Don't capture if only modifier keys are pressed
  const modifierKeys = ['Control', 'Shift', 'Alt', 'Meta', 'ContextMenu', 'OS']
  if (modifierKeys.includes(e.key)) {
    return null
  }

  // Build the shortcut string
  const parts: string[] = []

  // Use CommandOrControl for cross-platform compatibility
  if (e.metaKey || e.ctrlKey) {
    parts.push('CommandOrControl')
  }
  if (e.shiftKey) {
    parts.push('Shift')
  }
  if (e.altKey) {
    parts.push('Alt')
  }

  // Must have at least one modifier for a global shortcut
  if (parts.length === 0) {
    return null
  }

  // Map key to Tauri-compatible format
  let key = e.code

  // Handle special keys
  if (key.startsWith('Key')) {
    key = key.slice(3) // KeyA -> A
  } else if (key.startsWith('Digit')) {
    key = key.slice(5) // Digit1 -> 1
  } else if (key.startsWith('Numpad')) {
    key = 'Num' + key.slice(6) // Numpad1 -> Num1
  }

  parts.push(key)

  return parts.join('+')
}

export function ShortcutPicker({
  value,
  defaultValue,
  onChange,
  disabled = false,
  className,
}: ShortcutPickerProps) {
  const { t } = useTranslation()
  const [isCapturing, setIsCapturing] = useState(false)
  const [pendingShortcut, setPendingShortcut] = useState<string | null>(null)
  const inputRef = useRef<HTMLDivElement>(null)

  const displayValue = value ?? defaultValue
  const isDefault = value === null

  // Handle keyboard events when capturing
  useEffect(() => {
    if (!isCapturing) return

    const inputElement = inputRef.current

    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      // Escape cancels capture
      if (e.key === 'Escape') {
        setPendingShortcut(null)
        setIsCapturing(false)
        return
      }

      const shortcut = keyEventToShortcut(e)
      if (shortcut) {
        setPendingShortcut(shortcut)
      }
    }

    const handleKeyUp = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopPropagation()

      // If we have a pending shortcut and key is released, confirm it
      if (pendingShortcut) {
        // Compare to default to determine if we should save null or the shortcut
        const valueToSave =
          pendingShortcut === defaultValue ? null : pendingShortcut
        onChange(valueToSave)
        setPendingShortcut(null)
        setIsCapturing(false)
      }
    }

    const handleBlur = () => {
      setPendingShortcut(null)
      setIsCapturing(false)
    }

    window.addEventListener('keydown', handleKeyDown, true)
    window.addEventListener('keyup', handleKeyUp, true)
    inputElement?.addEventListener('blur', handleBlur)

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true)
      window.removeEventListener('keyup', handleKeyUp, true)
      inputElement?.removeEventListener('blur', handleBlur)
    }
  }, [isCapturing, pendingShortcut, defaultValue, onChange])

  const handleClick = () => {
    if (disabled) return
    setIsCapturing(true)
    inputRef.current?.focus()
  }

  const handleReset = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled) return
    onChange(null)
  }

  return (
    <div className="flex items-center gap-2">
      <div
        ref={inputRef}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onClick={handleClick}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            handleClick()
          }
        }}
        className={cn(
          'border-input h-9 min-w-[120px] rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none select-none',
          'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
          'flex items-center justify-center font-mono',
          isCapturing && 'border-ring ring-ring/50 ring-[3px] bg-muted/50',
          disabled && 'pointer-events-none cursor-not-allowed opacity-50',
          className
        )}
      >
        {isCapturing ? (
          <span className="text-muted-foreground animate-pulse">
            {pendingShortcut
              ? formatShortcutForDisplay(pendingShortcut)
              : 'Press shortcut...'}
          </span>
        ) : (
          <span className={isDefault ? 'text-muted-foreground' : ''}>
            {formatShortcutForDisplay(displayValue)}
          </span>
        )}
      </div>

      {!isDefault && !disabled && (
        <button
          type="button"
          onClick={handleReset}
          className="text-muted-foreground hover:text-foreground text-xs underline"
        >
          {t('common.reset')}
        </button>
      )}
    </div>
  )
}
