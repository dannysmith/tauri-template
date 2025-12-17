import React from 'react'
import { useTranslation } from 'react-i18next'
import { locale } from '@tauri-apps/plugin-os'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useTheme } from '@/hooks/use-theme'
import { usePreferences, useSavePreferences } from '@/services/preferences'
import { availableLanguages } from '@/i18n'

const SettingsField: React.FC<{
  label: string
  children: React.ReactNode
  description?: string
}> = ({ label, children, description }) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium text-foreground">{label}</Label>
    {children}
    {description && (
      <p className="text-sm text-muted-foreground">{description}</p>
    )}
  </div>
)

const SettingsSection: React.FC<{
  title: string
  children: React.ReactNode
}> = ({ title, children }) => (
  <div className="space-y-4">
    <div>
      <h3 className="text-lg font-medium text-foreground">{title}</h3>
      <Separator className="mt-2" />
    </div>
    <div className="space-y-4">{children}</div>
  </div>
)

// Language display names (native names)
const languageNames: Record<string, string> = {
  en: 'English',
  es: 'Español',
  de: 'Deutsch',
  fr: 'Français',
  ar: 'العربية',
  he: 'עברית',
  ja: '日本語',
  zh: '中文',
}

export const AppearancePane: React.FC = () => {
  const { t, i18n } = useTranslation()
  const { theme, setTheme } = useTheme()
  const { data: preferences } = usePreferences()
  const savePreferences = useSavePreferences()

  const handleThemeChange = async (value: 'light' | 'dark' | 'system') => {
    // Update the theme provider immediately for instant UI feedback
    setTheme(value)

    // Persist the theme preference to disk, preserving other preferences
    if (preferences) {
      savePreferences.mutate({ ...preferences, theme: value })
    }
  }

  const handleLanguageChange = async (value: string) => {
    const language = value === 'system' ? null : value

    // Change the language immediately for instant UI feedback
    if (language) {
      await i18n.changeLanguage(language)
    } else {
      // System language selected - detect and apply system locale
      const systemLocale = await locale()
      const langCode = systemLocale?.split('-')[0]?.toLowerCase() ?? 'en'
      const targetLang = availableLanguages.includes(langCode) ? langCode : 'en'
      await i18n.changeLanguage(targetLang)
    }

    // Persist the language preference to disk
    if (preferences) {
      savePreferences.mutate({ ...preferences, language })
    }
  }

  // Determine the current language value for the select
  const currentLanguageValue = preferences?.language ?? 'system'

  return (
    <div className="space-y-6">
      <SettingsSection title={t('preferences.appearance.language')}>
        <SettingsField
          label={t('preferences.appearance.language')}
          description={t('preferences.appearance.languageDescription')}
        >
          <Select
            value={currentLanguageValue}
            onValueChange={handleLanguageChange}
            disabled={savePreferences.isPending}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="system">
                {t('preferences.appearance.language.system')}
              </SelectItem>
              {availableLanguages.map(lang => (
                <SelectItem key={lang} value={lang}>
                  {languageNames[lang] ?? lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingsField>
      </SettingsSection>

      <SettingsSection title={t('preferences.appearance.theme')}>
        <SettingsField
          label={t('preferences.appearance.colorTheme')}
          description={t('preferences.appearance.colorThemeDescription')}
        >
          <Select
            value={theme}
            onValueChange={handleThemeChange}
            disabled={savePreferences.isPending}
          >
            <SelectTrigger>
              <SelectValue
                placeholder={t('preferences.appearance.selectTheme')}
              />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="light">
                {t('preferences.appearance.theme.light')}
              </SelectItem>
              <SelectItem value="dark">
                {t('preferences.appearance.theme.dark')}
              </SelectItem>
              <SelectItem value="system">
                {t('preferences.appearance.theme.system')}
              </SelectItem>
            </SelectContent>
          </Select>
        </SettingsField>
      </SettingsSection>
    </div>
  )
}
