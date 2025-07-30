import { invoke } from '@tauri-apps/api/core'
import { toast } from 'sonner'

// Standard error handling pattern for Tauri commands
// This provides consistent error handling across the app with automatic toasts and logging
export const safeInvoke = async <T>(
  command: string,
  args?: Record<string, unknown>
): Promise<T | null> => {
  try {
    return await invoke<T>(command, args)
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Unknown error occurred'
    
    // Show user-friendly toast notification
    toast.error(`Failed to ${command.replace(/_/g, ' ')}`, { 
      description: message 
    })

    // Log detailed error for debugging
    if (import.meta.env.DEV) {
      console.error(`Command ${command} failed:`, error)
    }

    return null
  }
}