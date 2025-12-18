import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../../locales/en.json'
import ar from '../../locales/ar.json'
import fr from '../../locales/fr.json'

const resources = {
  en: { translation: en },
  ar: { translation: ar },
  fr: { translation: fr },
}

// RTL language detection (includes languages not yet in resources for future expansion)
const rtlLanguages = ['ar', 'he', 'fa', 'ur']

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes
  },
})

// Update document direction and lang on language change
i18n.on('languageChanged', lng => {
  const dir = rtlLanguages.includes(lng) ? 'rtl' : 'ltr'
  document.documentElement.dir = dir
  document.documentElement.lang = lng
})

export default i18n

// Export for use in non-React contexts (like menu building)
export { i18n }

// Helper to get available languages
export const availableLanguages = Object.keys(resources)

// Check if a language is RTL
export const isRTL = (lng: string): boolean => rtlLanguages.includes(lng)
