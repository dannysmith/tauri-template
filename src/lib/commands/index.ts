import { invoke } from '@tauri-apps/api/core'

// Type-safe wrapper for Tauri commands
export async function invokeCommand<T = any>(
  command: string,
  args?: Record<string, any>
): Promise<T> {
  try {
    return await invoke(command, args)
  } catch (error) {
    console.error(`Failed to invoke command: ${command}`, error)
    throw error
  }
}

// Example command functions
export async function greetUser(name: string): Promise<string> {
  return invokeCommand<string>('greet', { name })
}