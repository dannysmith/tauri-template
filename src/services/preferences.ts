import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { safeInvoke } from '@/lib/safe-invoke'
import type { AppPreferences } from '@/types/preferences'

// Query keys for preferences
export const preferencesQueryKeys = {
  all: ['preferences'] as const,
  preferences: () => [...preferencesQueryKeys.all] as const,
}

// Tauri command wrappers using safeInvoke for consistent error handling
export const preferencesService = {
  load: async (): Promise<AppPreferences | null> => {
    return await safeInvoke<AppPreferences>('load_preferences')
  },

  save: async (preferences: AppPreferences): Promise<void | null> => {
    return await safeInvoke<void>('save_preferences', { preferences })
  },
}

// TanStack Query hooks following the architectural patterns
export function usePreferences() {
  return useQuery({
    queryKey: preferencesQueryKeys.preferences(),
    queryFn: async () => {
      const result = await preferencesService.load()
      // If safeInvoke returned null due to error, return default preferences
      if (result === null) {
        return { theme: 'system' } as AppPreferences
      }
      return result
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  })
}

export function useSavePreferences() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (preferences: AppPreferences) => {
      const result = await preferencesService.save(preferences)
      // If safeInvoke returned null, the error was already handled
      if (result === null) {
        throw new Error('Failed to save preferences')
      }
      return result
    },
    onSuccess: (_, preferences) => {
      // Update the cache with the new preferences
      queryClient.setQueryData(preferencesQueryKeys.preferences(), preferences)
    },
    // Error handling is now done by safeInvoke, so we don't need onError
  })
}

// Convenience hook that combines both load and save
// Use this in preference panes when you need to persist settings to disk
export function usePreferencesManager() {
  const { data: preferences, isLoading, error } = usePreferences()
  const savePreferencesMutation = useSavePreferences()

  // Update function for persistent preferences
  // Only call this for settings that should be saved to disk
  const updatePreferences = async (updates: Partial<AppPreferences>) => {
    if (!preferences) return

    const updatedPreferences = { ...preferences, ...updates }
    try {
      await savePreferencesMutation.mutateAsync(updatedPreferences)
    } catch (error) {
      // Error already handled by safeInvoke, but we can optionally handle it here too
      console.error('Failed to update preferences:', error)
    }
  }

  return {
    preferences,
    isLoading,
    error,
    updatePreferences,
    isSaving: savePreferencesMutation.isPending,
    saveError: savePreferencesMutation.error,
  }
}