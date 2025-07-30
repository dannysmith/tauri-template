// Types that match the Rust AppPreferences struct
// Only contains settings that should be persisted to disk
export interface AppPreferences {
  theme: string
  // Add new persistent preferences here, e.g.:
  // auto_save: boolean
  // language: string
}

export const defaultPreferences: AppPreferences = {
  theme: 'system',
  // Add defaults for new preferences here
}
