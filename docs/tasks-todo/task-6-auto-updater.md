# Task 6: Copy Working Auto-Updater

## Overview
Copy the proven auto-updater code from the other app and adapt it for this template.

**KEEP IT SIMPLE** - Copy the working App.tsx code with minimal changes.

## What We Need
1. Copy the updater logic from other app's App.tsx
2. Configure tauri.conf.json with updater settings (already provided)  
3. Add updater plugin to dependencies
4. Basic error handling and user feedback

## Implementation Plan

### 1. Copy App.tsx Auto-Update Logic
- Copy the `useEffect` with `checkForUpdates` from other app
- Uses `@tauri-apps/plugin-updater` and `@tauri-apps/plugin-process`
- 5-second delay after app launch
- Simple confirm() dialogs for user interaction

### 2. Configure Tauri
- Updater plugin already configured in the provided tauri.conf.json
- Just need to update URLs to template placeholders
- Generate signing keys for template

### 3. Add Dependencies
- Ensure updater and process plugins are in dependencies
- Already installed: `@tauri-apps/plugin-updater`, `@tauri-apps/plugin-process`

### 4. Simple User Experience
- Uses browser confirm() for now (simple and works)
- Console logging for progress tracking
- Future: can be enhanced with proper UI components

## Files to Create/Modify
- `src/App.tsx` (add auto-update logic from other app)
- `src-tauri/tauri.conf.json` (update URLs to template placeholders)
- Maybe: generate new signing keys for template

## Simple Update Flow
1. App starts, waits 5 seconds
2. Checks for updates silently
3. If update available, shows confirm dialog
4. If user agrees, downloads and installs
5. Asks user if they want to restart now

## Acceptance Criteria
- [ ] Auto-update logic copied from working app
- [ ] 5-second delay check on app launch works
- [ ] Update available dialog appears correctly
- [ ] Download and install process works
- [ ] User can choose when to restart
- [ ] Error handling for network issues
- [ ] Template placeholders for GitHub URLs

# EXamples from Other App

## App.tsx

```
import { Layout } from './components/layout'
import { ThemeProvider } from './lib/theme-provider'
import { check } from '@tauri-apps/plugin-updater'
import { relaunch } from '@tauri-apps/plugin-process'
import { info, error } from '@tauri-apps/plugin-log'
import { useEffect } from 'react'
import './App.css'

function App() {
  useEffect(() => {
    const checkForUpdates = async () => {
      try {
        const update = await check()
        if (update) {
          await info(`Update available: ${update.version}`)

          // Show toast notification or modal
          const shouldUpdate = confirm(
            `Update available: ${update.version}\n\nWould you like to install this update now?`
          )

          if (shouldUpdate) {
            try {
              // Download and install silently with only console logging
              await update.downloadAndInstall(event => {
                switch (event.event) {
                  case 'Started':
                    void info(`Downloading ${event.data.contentLength} bytes`)
                    break
                  case 'Progress':
                    void info(`Downloaded: ${event.data.chunkLength} bytes`)
                    break
                  case 'Finished':
                    void info('Download complete, installing...')
                    break
                }
              })

              // Ask if user wants to restart now
              const shouldRestart = confirm(
                'Update completed successfully!\n\nWould you like to restart the app now to use the new version?'
              )

              if (shouldRestart) {
                await relaunch()
              }
            } catch (updateError) {
              await error(`Update installation failed: ${String(updateError)}`)
              alert(
                `Update failed: There was a problem with the automatic download.\n\n${String(updateError)}`
              )
            }
          }
        }
      } catch (checkError) {
        await error(`Update check failed: ${String(checkError)}`)
        // Show user-friendly error message
      }
    }

    // Check for updates 5 seconds after app loads
    const timer = setTimeout(checkForUpdates, 5000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <ThemeProvider defaultTheme="system" storageKey="astro-editor-theme">
      <Layout />
    </ThemeProvider>
  )
}

export default App

```

## Tauri Conf File

```
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Astro Editor",
  "version": "0.1.10",
  "identifier": "is.danny.astroeditor",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:1420",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [
      {
        "title": "Astro Editor",
        "width": 1400,
        "height": 900,
        "minWidth": 1000,
        "minHeight": 700,
        "resizable": true,
        "fullscreen": false,
        "maximized": false,
        "center": true,
        "decorations": false,
        "alwaysOnTop": false,
        "transparent": true,
        "shadow": true,
        "dragDropEnabled": true
      }
    ],
    "security": {
      "csp": null
    },
    "macOSPrivateApi": true,
    "withGlobalTauri": false
  },
  "bundle": {
    "createUpdaterArtifacts": true,
    "active": true,
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "publisher": "Danny Smith",
    "category": "DeveloperTool",
    "shortDescription": "A beautiful markdown editor for Astro content collections",
    "longDescription": "Astro Editor is a native macOS application designed specifically for editing Astro content collections. It provides a distraction-free writing environment with seamless frontmatter editing capabilities. It also provides a component builder for MDX files, and a number of writing modes to help you write.",
    "copyright": "Copyright © 2025 Danny Smith. All rights reserved.",
    "fileAssociations": [
      {
        "ext": [
          "md"
        ],
        "name": "Markdown Document",
        "description": "Markdown document",
        "role": "Editor"
      },
      {
        "ext": [
          "mdx"
        ],
        "name": "MDX Document",
        "description": "MDX document with React components",
        "role": "Editor"
      }
    ],
    "macOS": {
      "frameworks": [],
      "minimumSystemVersion": "10.15",
      "signingIdentity": "-",
      "providerShortName": null,
      "entitlements": null,
      "exceptionDomain": ""
    }
  },
  "plugins": {
    "opener": {
      "requireLiteralLeadingDot": false
    },
    "shell": {
      "open": true
    },
    "updater": {
      "active": true,
      "endpoints": [
        "https://github.com/dannysmith/astro-editor/releases/latest/download/latest.json"
      ],
      "dialog": true,
      "pubkey": "dW50cnVzdGVkIGNvbW1lbnQ6IG1pbmlzaWduIHB1YmxpYyBrZXk6IEIxRjIwNEJDQkRFRDcwRDkKUldUWmNPMjl2QVR5c2VhQjRwTXBqRi9ZMk81azVERVlXMk1tQmdpZ01QdlY0RWExdE5yZXA4SS8K"
    }
  }
}

```
