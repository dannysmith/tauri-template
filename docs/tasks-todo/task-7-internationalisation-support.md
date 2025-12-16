# Internationalisation Support

## Overview

Provide a simple, extensible structure for i18n support following Tauri app conventions. This implementation uses **react-i18next** for all translations, including native menus (built via Tauri's JavaScript menu API).

**Key insight:** Tauri v2 supports building native menus entirely from JavaScript, eliminating the need for Rust-side i18n. This dramatically simplifies the architecture.

## Architecture

### Single Source of Truth

```
┌─────────────────────────────────────────┐
│           /locales/en.json              │
│      (Standard i18next format)          │
│      Uses {{variable}} syntax           │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│         React + i18next                 │
│                                         │
│  • All UI component strings             │
│  • Command palette labels               │
│  • Preferences pane text                │
│  • Native menus (via @tauri-apps/api)   │
│  • Toast notifications                  │
│  • Error messages                       │
└─────────────────────────────────────────┘
```

### Translation File Structure

```
/locales/
├── en.json          # English (default/fallback)
├── es.json          # Spanish (example)
├── de.json          # German (tests long strings)
└── ar.json          # Arabic (tests RTL)
```

### JSON Format

```json
{
  "app.name": "Tauri Template",

  "menu.about": "About {{appName}}",
  "menu.checkForUpdates": "Check for Updates...",
  "menu.preferences": "Preferences...",
  "menu.hide": "Hide {{appName}}",
  "menu.quit": "Quit {{appName}}",
  "menu.view": "View",
  "menu.toggleLeftSidebar": "Toggle Left Sidebar",
  "menu.toggleRightSidebar": "Toggle Right Sidebar",

  "preferences.title": "Preferences",
  "preferences.general": "General",
  "preferences.appearance": "Appearance",
  "preferences.appearance.language": "Language",
  "preferences.appearance.language.system": "System Default",
  "preferences.appearance.theme": "Theme",
  "preferences.appearance.theme.light": "Light",
  "preferences.appearance.theme.dark": "Dark",
  "preferences.appearance.theme.system": "System",

  "commands.group.navigation": "Navigation",
  "commands.group.settings": "Settings",
  "commands.group.window": "Window",
  "commands.toggleLeftSidebar.label": "Toggle Left Sidebar",
  "commands.toggleLeftSidebar.description": "Show or hide the left sidebar",

  "toast.success.preferencesSaved": "Preferences saved",
  "toast.error.generic": "Something went wrong",

  "titlebar.default": "Tauri App"
}
```

---

## Implementation Plan

### Phase 1: Core i18n Infrastructure

**Goal:** Set up i18next and create the translation system.

#### 1.1 Install Dependencies

```bash
npm install react-i18next i18next
```

#### 1.2 Create Translation File

Create `/locales/en.json` with all current hardcoded strings (see format above).

#### 1.3 Configure i18next

Create `/src/i18n/config.ts`:

```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '../../locales/en.json'

const resources = {
  en: { translation: en },
  // Add other languages here as they're created
}

i18n.use(initReactI18next).init({
  resources,
  lng: 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false, // React already escapes
  },
})

// RTL language detection
const rtlLanguages = ['ar', 'he', 'fa', 'ur']
i18n.on('languageChanged', (lng) => {
  const dir = rtlLanguages.includes(lng) ? 'rtl' : 'ltr'
  document.documentElement.dir = dir
  document.documentElement.lang = lng
})

export default i18n
```

Create `/src/i18n/i18n.d.ts` for TypeScript autocomplete:

```typescript
import 'react-i18next'
import en from '../../locales/en.json'

declare module 'react-i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: typeof en
    }
  }
}
```

#### 1.4 Initialize in App

In `main.tsx`:

```typescript
import './i18n/config'
```

#### 1.5 Add Language to Preferences

Extend preferences to include language setting (TypeScript type + Rust struct if needed).

---

### Phase 2: Migrate React Strings

**Goal:** Replace all hardcoded strings with `t()` calls.

#### Pattern to Follow

```typescript
import { useTranslation } from 'react-i18next'

function MyComponent() {
  const { t } = useTranslation()
  return <h1>{t('preferences.title')}</h1>
}
```

#### Files to Update

- `src/components/preferences/PreferencesDialog.tsx`
- `src/components/preferences/GeneralPane.tsx`
- `src/components/preferences/AppearancePane.tsx`
- `src/components/preferences/AdvancedPane.tsx`
- `src/components/command-palette/CommandPalette.tsx`
- `src/components/titlebar/TitleBar.tsx`
- `src/components/layout/*.tsx`
- `src/lib/commands/*.ts` (command labels, descriptions, group names)
- Any components with toast messages

#### Add Language Selector

Add to AppearancePane:

```typescript
const { t, i18n } = useTranslation()

<Select
  value={preferences.language ?? 'system'}
  onValueChange={(lang) => {
    updatePreferences({ language: lang === 'system' ? null : lang })
    if (lang !== 'system') i18n.changeLanguage(lang)
  }}
>
  <SelectItem value="system">{t('preferences.appearance.language.system')}</SelectItem>
  <SelectItem value="en">English</SelectItem>
  <SelectItem value="es">Español</SelectItem>
</Select>
```

---

### Phase 3: Native Menus from JavaScript

**Goal:** Move menu creation from Rust to JavaScript so menus use the i18n system.

#### Current State (Rust)

Menus are currently built in `src-tauri/src/lib.rs` with hardcoded strings.

#### New Approach (JavaScript)

Create `/src/lib/menu.ts`:

```typescript
import { Menu, MenuItem, Submenu, PredefinedMenuItem } from '@tauri-apps/api/menu'
import i18n from '@/i18n/config'

const t = i18n.t.bind(i18n)
const appName = 'Tauri Template' // Or get from config

export async function buildAppMenu() {
  const menu = await Menu.new({
    items: [
      // App submenu (macOS) / File menu (Windows/Linux)
      await Submenu.new({
        text: appName,
        items: [
          await MenuItem.new({
            id: 'about',
            text: t('menu.about', { appName }),
            action: () => { /* show about dialog */ }
          }),
          await PredefinedMenuItem.new({ item: 'Separator' }),
          await MenuItem.new({
            id: 'check-updates',
            text: t('menu.checkForUpdates'),
            action: () => { /* check for updates */ }
          }),
          await PredefinedMenuItem.new({ item: 'Separator' }),
          await MenuItem.new({
            id: 'preferences',
            text: t('menu.preferences'),
            accelerator: 'CmdOrCtrl+,',
            action: () => { /* open preferences */ }
          }),
          await PredefinedMenuItem.new({ item: 'Separator' }),
          await PredefinedMenuItem.new({ item: 'Hide' }),
          await PredefinedMenuItem.new({ item: 'HideOthers' }),
          await PredefinedMenuItem.new({ item: 'ShowAll' }),
          await PredefinedMenuItem.new({ item: 'Separator' }),
          await PredefinedMenuItem.new({ item: 'Quit' }),
        ],
      }),
      // View submenu
      await Submenu.new({
        text: t('menu.view'),
        items: [
          await MenuItem.new({
            id: 'toggle-left-sidebar',
            text: t('menu.toggleLeftSidebar'),
            action: () => { /* toggle sidebar */ }
          }),
          await MenuItem.new({
            id: 'toggle-right-sidebar',
            text: t('menu.toggleRightSidebar'),
            action: () => { /* toggle sidebar */ }
          }),
        ],
      }),
    ],
  })

  await menu.setAsAppMenu()
  return menu
}

// Rebuild menu when language changes
export function setupMenuLanguageListener() {
  i18n.on('languageChanged', () => {
    buildAppMenu()
  })
}
```

Initialize in app startup:

```typescript
import { buildAppMenu, setupMenuLanguageListener } from '@/lib/menu'

// On app ready
await buildAppMenu()
setupMenuLanguageListener()
```

#### Remove Rust Menu Code

Remove menu building code from `src-tauri/src/lib.rs` (the parts that create menus with hardcoded strings).

---

### Phase 4: System Locale Detection

**Goal:** Detect system language and apply it on startup.

#### Check if os plugin exists

First check if `@tauri-apps/plugin-os` is already installed. If not:

```bash
npm run tauri add os
```

#### Detect and Apply System Locale

In app initialization:

```typescript
import { locale } from '@tauri-apps/plugin-os'
import i18n from '@/i18n/config'

async function initializeLanguage(savedLanguage: string | null) {
  if (savedLanguage) {
    // User has explicit preference
    await i18n.changeLanguage(savedLanguage)
  } else {
    // Use system locale
    const systemLocale = await locale()
    const lang = systemLocale?.split('-')[0] ?? 'en'

    // Only apply if we have translations for this language
    const supportedLanguages = Object.keys(i18n.options.resources ?? {})
    if (supportedLanguages.includes(lang)) {
      await i18n.changeLanguage(lang)
    }
  }
}
```

---

### Phase 5: RTL Support & CSS Conversion

**Goal:** Convert physical CSS properties to logical properties for RTL language support.

**This is a separate commit from the i18n work.**

#### 5.1 Properties to Convert

| Physical | Logical (RTL-safe) |
|----------|-------------------|
| `ml-*` | `ms-*` |
| `mr-*` | `me-*` |
| `pl-*` | `ps-*` |
| `pr-*` | `pe-*` |
| `left-*` | `start-*` |
| `right-*` | `end-*` |
| `text-left` | `text-start` |
| `text-right` | `text-end` |
| `border-l-*` | `border-s-*` |
| `border-r-*` | `border-e-*` |
| `rounded-l-*` | `rounded-s-*` |
| `rounded-r-*` | `rounded-e-*` |

#### 5.2 Files Requiring Updates

**High priority (layout):**
- `src/components/ui/sidebar.tsx` - 13 instances
- `src/components/ui/dialog.tsx` - positioning
- `src/components/ui/sheet.tsx` - side positioning
- `src/components/ui/alert-dialog.tsx` - text alignment

**Medium priority (components):**
- `src/components/ui/dropdown-menu.tsx` - 9 instances
- `src/components/ui/input-group.tsx` - 6 instances
- `src/components/ui/select.tsx`
- `src/components/titlebar/*.tsx`
- `src/components/command-palette/CommandPalette.tsx`

**Lower priority:**
- `src/components/ui/calendar.tsx` (already has some RTL)
- `src/components/ui/popover.tsx`
- Various other UI components

#### 5.3 Special Cases

**Sidebar transitions:**
```typescript
// Before
className="transition-[left,right,width]"

// After - use CSS custom properties or separate RTL handling
className="transition-[inset-inline-start,inset-inline-end,width]"
```

**Centered dialogs:**
```typescript
// Before
className="left-[50%] translate-x-[-50%]"

// After - use flexbox/grid centering or inset
className="inset-0 flex items-center justify-center"
```

#### 5.4 Testing

Create Arabic translation file `/locales/ar.json` for testing:

```json
{
  "app.name": "قالب تاوري",
  "preferences.title": "التفضيلات",
  "preferences.appearance": "المظهر"
}
```

Test by:
1. Setting language to Arabic
2. Verifying `dir="rtl"` is set on `<html>`
3. Checking sidebar, dialogs, menus render correctly
4. Verifying text alignment and spacing

---

### Phase 6: Documentation

**Goal:** Document patterns for developers building on this template.

#### Create `/docs/developer/i18n-patterns.md`:

```markdown
# Internationalization (i18n) Patterns

## Adding New Translatable Strings

1. Add key to `/locales/en.json`:
   ```json
   "myFeature.title": "My Feature"
   ```

2. Use in React component:
   ```typescript
   const { t } = useTranslation()
   return <h1>{t('myFeature.title')}</h1>
   ```

3. Add translations to other locale files.

## Key Naming Convention

Use dot notation: `category.subcategory.name`

Categories:
- `app` - Application-level strings
- `menu` - Native menu items
- `preferences` - Settings pane text
- `commands` - Command palette entries
- `toast` - Notification messages
- `errors` - Error messages

## Interpolation

```typescript
// JSON: "greeting": "Hello, {{name}}!"
t('greeting', { name: 'World' })
```

## Pluralization

```json
{
  "item_one": "{{count}} item",
  "item_other": "{{count}} items"
}
```

```typescript
t('item', { count: 5 }) // "5 items"
```

## Adding a New Language

1. Copy `locales/en.json` to `locales/{code}.json`
2. Translate all values (keep keys unchanged)
3. Add import to `src/i18n/config.ts`:
   ```typescript
   import es from '../../locales/es.json'

   const resources = {
     en: { translation: en },
     es: { translation: es },
   }
   ```
4. Add to language selector in AppearancePane

## RTL Languages

RTL is automatic. When language changes to ar/he/fa/ur:
- `dir="rtl"` is set on `<html>`
- CSS logical properties handle layout flipping
- No component changes needed
```

#### Update CLAUDE.md

Add i18n section to architecture patterns.

---

## Tasks

### Phase 1: Core Infrastructure
- [ ] Install react-i18next and i18next
- [ ] Create `/locales/en.json` with all strings
- [ ] Create `/src/i18n/config.ts`
- [ ] Create `/src/i18n/i18n.d.ts` for TypeScript
- [ ] Import i18n config in main.tsx
- [ ] Add `language` field to preferences

### Phase 2: Migrate React Strings
- [ ] Migrate PreferencesDialog strings
- [ ] Migrate GeneralPane strings
- [ ] Migrate AppearancePane strings (+ add language selector)
- [ ] Migrate AdvancedPane strings
- [ ] Migrate CommandPalette strings
- [ ] Migrate command definitions (labels, descriptions)
- [ ] Migrate TitleBar strings
- [ ] Migrate toast messages
- [ ] Migrate any remaining hardcoded strings

### Phase 3: Native Menus from JavaScript
- [ ] Create `/src/lib/menu.ts` with translated menu builder
- [ ] Wire up menu actions to existing functionality
- [ ] Add language change listener to rebuild menus
- [ ] Remove Rust menu code from lib.rs
- [ ] Test menus on macOS, Windows, Linux

### Phase 4: System Locale Detection
- [ ] Verify/install @tauri-apps/plugin-os
- [ ] Implement system locale detection on startup
- [ ] Apply saved language preference or system locale
- [ ] Test with various system locales

### Phase 5: RTL Support (Separate Commit)
- [ ] Convert sidebar.tsx (13 instances)
- [ ] Convert dialog.tsx and alert-dialog.tsx
- [ ] Convert sheet.tsx
- [ ] Convert dropdown-menu.tsx (9 instances)
- [ ] Convert input-group.tsx (6 instances)
- [ ] Convert remaining components with physical properties
- [ ] Create `/locales/ar.json` for testing
- [ ] Test RTL layout with Arabic

### Phase 6: Documentation
- [ ] Create `/docs/developer/i18n-patterns.md`
- [ ] Update CLAUDE.md with i18n patterns
- [ ] Add i18n section to architecture guide

---

## Notes

### Why No Rust-Side i18n?

Tauri v2 supports building native menus from JavaScript. This means:
- All translations stay in one place (React/i18next)
- No interpolation syntax conflicts (rust-i18n uses `%{var}`, i18next uses `{{var}}`)
- Simpler architecture
- Easier menu rebuilding on language change

The only Rust strings are internal errors/logs, which don't need translation.

### Complexity Assessment

- **Phase 1-4 (Basic i18n):** ~1-2 hours
- **Phase 5 (RTL):** ~2-3 hours (47 property conversions)
- **Phase 6 (Docs):** ~30 minutes
- **Total:** ~4-5 hours

### Easy to Remove

If a project doesn't need i18n:
1. Delete `/locales/` directory
2. Remove i18next dependencies
3. Replace `t('key')` calls with hardcoded strings
4. Revert to Rust menu building if preferred
