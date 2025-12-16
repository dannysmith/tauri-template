import { useState, useEffect, useRef } from 'react'
import { emit } from '@tauri-apps/api/event'
import { getCurrentWindow } from '@tauri-apps/api/window'
import { Input } from '@/components/ui/input'

/**
 * QuickPaneApp - A minimal floating window for quick text entry.
 *
 * This component demonstrates the quick pane pattern:
 * - Single text input with submit on Enter
 * - Emits 'quick-pane-submit' event with the entered text
 * - Theme synced with main window via localStorage
 * - Hides window on submit or Escape
 */
export default function QuickPaneApp() {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // Apply theme from localStorage (synced with main window)
  useEffect(() => {
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
  }, [])

  // Focus input when window becomes visible
  useEffect(() => {
    const focusInput = () => {
      inputRef.current?.focus()
    }

    // Focus on mount
    focusInput()

    // Also focus when window gains focus
    const currentWindow = getCurrentWindow()
    const unlisten = currentWindow.onFocusChanged(({ payload: focused }) => {
      if (focused) {
        focusInput()
      }
    })

    return () => {
      unlisten.then(fn => fn())
    }
  }, [])

  // Handle Escape key to dismiss
  useEffect(() => {
    const handleKeyDown = async (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const currentWindow = getCurrentWindow()
        await currentWindow.hide()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const currentWindow = getCurrentWindow()

    if (text.trim()) {
      // Emit the event for main window to handle
      await emit('quick-pane-submit', { text: text.trim() })
      setText('')
    }

    await currentWindow.hide()
  }

  return (
    <div className="bg-background flex h-screen w-screen items-center justify-center p-3">
      <form onSubmit={handleSubmit} className="w-full">
        <Input
          ref={inputRef}
          type="text"
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Enter text..."
          className="bg-background h-11 w-full text-base"
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck={false}
        />
      </form>
    </div>
  )
}
