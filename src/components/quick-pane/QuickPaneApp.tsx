import { useState, useEffect, useRef } from 'react'
import { emit, listen } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { commands } from '@/lib/bindings'

/**
 * QuickPaneApp - A minimal floating window for quick text entry.
 *
 * This component demonstrates the quick pane pattern:
 * - Single text input with submit on Enter
 * - Emits 'quick-pane-submit' event with the entered text
 * - Theme synced with main window via localStorage
 * - Hides window on submit or Escape
 */
// Apply theme from localStorage to document
function applyTheme() {
  const theme = localStorage.getItem('ui-theme') || 'system'
  const root = document.documentElement

  root.classList.remove('light', 'dark')

  if (theme === 'system') {
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
      .matches
      ? 'dark'
      : 'light'
    root.classList.add(systemTheme)
  } else {
    root.classList.add(theme)
  }
}

export default function QuickPaneApp() {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Apply theme on mount and listen for theme changes from main window
  useEffect(() => {
    applyTheme()

    const unlisten = listen('theme-changed', () => {
      applyTheme()
    })

    return () => {
      unlisten.then(fn => fn())
    }
  }, [])

  // Focus input when window becomes visible, hide on blur
  useEffect(() => {
    const currentWindow = getCurrentWindow()
    const unlisten = currentWindow.onFocusChanged(
      async ({ payload: focused }) => {
        if (focused) {
          // Re-apply theme in case it changed while hidden
          applyTheme()
          inputRef.current?.focus()
        } else {
          // Hide window when it loses focus (dismiss on blur)
          // Use dismiss command for consistent behavior (no animation)
          await commands.dismissQuickPane()
        }
      }
    )

    return () => {
      unlisten.then(fn => fn())
    }
  }, [])

  // Handle Escape key to dismiss
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault() // Prevent system "boop" sound
        await commands.dismissQuickPane()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (text.trim()) {
      // Emit the event for main window to handle
      await emit('quick-pane-submit', { text: text.trim() })
      setText('')
    }

    // Use dismiss command to avoid space switching on macOS
    await commands.dismissQuickPane()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-screen w-screen items-center rounded-xl bg-white/90 px-5 backdrop-blur-xl dark:bg-zinc-900/90"
    >
      <input
        ref={inputRef}
        type="text"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Enter text..."
        className="w-full bg-transparent text-lg text-zinc-900 placeholder-zinc-400 outline-none dark:text-white dark:placeholder-zinc-500"
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
      />
    </form>
  )
}
