/**
 * Language initialization utilities for detecting and applying the user's
 * preferred language at app startup.
 */
import { locale } from '@tauri-apps/plugin-os'
import i18n, { availableLanguages } from './config'
import { logger } from '@/lib/logger'

/**
 * Initialize the application language.
 *
 * Priority:
 * 1. User's saved language preference (if set)
 * 2. System locale (if we have translations for it)
 * 3. English (fallback)
 *
 * @param savedLanguage - The user's saved language preference from preferences
 */
export async function initializeLanguage(
  savedLanguage: string | null
): Promise<void> {
  try {
    if (savedLanguage) {
      // User has an explicit preference
      if (availableLanguages.includes(savedLanguage)) {
        await i18n.changeLanguage(savedLanguage)
        logger.info('Language set from user preference', {
          language: savedLanguage,
        })
      } else {
        logger.warn('Saved language not available, using English', {
          savedLanguage,
          availableLanguages,
        })
        await i18n.changeLanguage('en')
      }
      return
    }

    // No saved preference, try to detect system locale
    const systemLocale = await locale()
    logger.debug('Detected system locale', { systemLocale })

    if (systemLocale) {
      // Extract the language code (e.g., "en-US" -> "en")
      const parts = systemLocale.split('-')
      const langCode = (parts[0] ?? 'en').toLowerCase()

      if (availableLanguages.includes(langCode)) {
        await i18n.changeLanguage(langCode)
        logger.info('Language set from system locale', {
          systemLocale,
          language: langCode,
        })
        return
      }

      logger.debug('System locale not available in translations', {
        systemLocale,
        langCode,
        availableLanguages,
      })
    }

    // Fallback to English
    await i18n.changeLanguage('en')
    logger.info('Language set to English (fallback)')
  } catch (error) {
    logger.error('Failed to initialize language', { error })
    // Ensure we have some language set
    await i18n.changeLanguage('en')
  }
}
