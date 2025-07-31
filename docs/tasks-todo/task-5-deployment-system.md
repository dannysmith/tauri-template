# Task 5: Copy Working Deployment System

## Overview
Copy the proven deployment system from the other app (GitHub Actions + prepare-release.js script) and adapt it for this template.

**KEEP IT SIMPLE** - Copy the working system with minimal changes.

## What We Need
1. Copy GitHub Actions workflow from other app  
2. Copy prepare-release.js script 
3. Update tauri.conf.json for releases
4. Add release scripts to package.json
5. Basic documentation

## Implementation Plan

### 1. Copy GitHub Actions Workflow
- Copy `.github/workflows/release.yml` from other app
- Update app name references to be template-friendly
- Keep the exact same workflow structure (it works!)

### 2. Copy Release Script  
- Copy `scripts/prepare-release.js` from other app
- Update GitHub URLs to be template placeholders
- Keep all the version management logic

### 3. Configure Tauri for Releases
- Add `"createUpdaterArtifacts": true` to tauri.conf.json
- Set up bundle configuration for releases
- Configure updater endpoints (template placeholders)

### 4. Add Package Scripts
- Add release scripts to package.json
- Simple commands to run the release process

## Files to Create/Modify
- `.github/workflows/release.yml` (copy from other app)  
- `scripts/prepare-release.js` (copy from other app)
- `src-tauri/tauri.conf.json` (add release settings)
- `package.json` (add release scripts)

## Simple Process
1. Run `npm run release:prepare v1.0.0`
2. Script updates versions and creates git tag
3. Push tag triggers GitHub Actions
4. Automated build creates release with update JSON

## Acceptance Criteria
- [ ] GitHub Actions workflow copied and working
- [ ] prepare-release.js script copied and adapted
- [ ] tauri.conf.json configured for releases  
- [ ] Release process works end-to-end
- [ ] Update JSON generated correctly for auto-updater
- [ ] Template placeholders for app-specific details

## Working Code to Copy

## .github/actions/release.yml

```yaml
name: 'Release Astro Editor'

on:
  push:
    tags: ['v*']
  workflow_dispatch:
    inputs:
      version:
        description: 'Release version (e.g., v1.0.0)'
        required: true
        type: string

env:
  CARGO_TERM_COLOR: always
  RUST_BACKTRACE: 1

jobs:
  publish-tauri:
    permissions:
      contents: write
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: 'macos-latest'
            args: '--bundles app,dmg'

    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 'lts/*'
          cache: 'npm'

      - name: Install Rust stable
        uses: dtolnay/rust-toolchain@stable

      - name: Rust cache
        uses: swatinem/rust-cache@v2
        with:
          workspaces: './src-tauri -> target'

      - name: Install frontend dependencies
        run: npm ci

      - name: Build and release
        uses: tauri-apps/tauri-action@dev
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_PRIVATE_KEY }}
          TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
        with:
          tagName: ${{ github.ref_name || inputs.version }}
          releaseName: 'Astro Editor ${{ github.ref_name || inputs.version }}'
          releaseBody: |
            ## 🚀 Astro Editor ${{ github.ref_name || inputs.version }}

            ### Installation Instructions
            - **macOS**: Download the `.dmg` file and drag to Applications folder

            ### Auto-Updates
            Existing users will receive automatic update notifications.

            **Full Changelog**: https://github.com/${{ github.repository }}/commits/${{ github.ref_name || inputs.version }}
          releaseDraft: true
          prerelease: false
          includeUpdaterJson: true
          args: ${{ matrix.args }}
```

## scripts/prepare-release.js

```
#!/usr/bin/env node

import fs from 'fs'
import { execSync } from 'child_process'
import readline from 'readline'

function exec(command, options = {}) {
  try {
    return execSync(command, {
      encoding: 'utf8',
      stdio: options.silent ? 'pipe' : 'inherit',
      ...options
    })
  } catch (error) {
    throw new Error(`Command failed: ${command}\n${error.message}`)
  }
}

function askQuestion(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close()
      resolve(answer.trim())
    })
  })
}

async function prepareRelease() {
  const version = process.argv[2]

  if (!version || !version.match(/^v?\d+\.\d+\.\d+$/)) {
    console.error('❌ Usage: node scripts/prepare-release.js v1.0.0')
    console.error('   or: npm run prepare-release v1.0.0')
    process.exit(1)
  }

  const cleanVersion = version.replace('v', '')
  const tagVersion = version.startsWith('v') ? version : `v${version}`

  console.log(`🚀 Preparing release ${tagVersion}...\n`)

  try {
    // Check git status
    console.log('🔍 Checking git status...')
    const gitStatus = exec('git status --porcelain', { silent: true })
    if (gitStatus.trim()) {
      console.error('❌ Working directory is not clean. Please commit or stash changes first.')
      console.log('Uncommitted changes:')
      console.log(gitStatus)
      process.exit(1)
    }
    console.log('✅ Working directory is clean')

    // Run all checks first
    console.log('\n🔍 Running pre-release checks...')
    exec('npm run check:all')
    console.log('✅ All checks passed')

    // Update package.json
    console.log('\n📝 Updating package.json...')
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))
    const oldPkgVersion = pkg.version
    pkg.version = cleanVersion
    fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n')
    console.log(`   ${oldPkgVersion} → ${cleanVersion}`)

    // Update Cargo.toml
    console.log('📝 Updating Cargo.toml...')
    const cargoPath = 'src-tauri/Cargo.toml'
    const cargoToml = fs.readFileSync(cargoPath, 'utf8')
    const oldCargoVersion = cargoToml.match(/version = "([^"]*)"/)
    const updatedCargo = cargoToml.replace(
      /version = "[^"]*"/,
      `version = "${cleanVersion}"`
    )
    fs.writeFileSync(cargoPath, updatedCargo)
    console.log(`   ${oldCargoVersion ? oldCargoVersion[1] : 'unknown'} → ${cleanVersion}`)

    // Update tauri.conf.json
    console.log('📝 Updating tauri.conf.json...')
    const tauriConfigPath = 'src-tauri/tauri.conf.json'
    const tauriConfig = JSON.parse(fs.readFileSync(tauriConfigPath, 'utf8'))
    const oldTauriVersion = tauriConfig.version
    tauriConfig.version = cleanVersion
    fs.writeFileSync(tauriConfigPath, JSON.stringify(tauriConfig, null, 2) + '\n')
    console.log(`   ${oldTauriVersion} → ${cleanVersion}`)

    // Run npm install to update lock files
    console.log('\n📦 Updating lock files...')
    exec('npm install', { silent: true })
    console.log('✅ Lock files updated')

    // Verify configurations
    console.log('\n🔍 Verifying configurations...')

    if (!tauriConfig.bundle?.createUpdaterArtifacts) {
      console.warn('⚠️  Warning: createUpdaterArtifacts not enabled in tauri.conf.json')
    } else {
      console.log('✅ Updater artifacts enabled')
    }

    if (!tauriConfig.plugins?.updater?.pubkey) {
      console.warn('⚠️  Warning: Updater public key not configured')
    } else {
      console.log('✅ Updater public key configured')
    }

    // Final check that Rust code compiles
    console.log('\n🔍 Running final compilation check...')
    exec('source ~/.cargo/env && cd src-tauri && cargo check')
    console.log('✅ Rust compilation check passed')

    console.log(`\n🎉 Successfully prepared release ${tagVersion}!`)
    console.log('\n📋 Git commands to execute:')
    console.log(`   git add .`)
    console.log(`   git commit -m "chore: release ${tagVersion}"`)
    console.log(`   git tag ${tagVersion}`)
    console.log(`   git push origin main --tags`)

    console.log('\n🚀 After pushing:')
    console.log('   • GitHub Actions will automatically build the release')
    console.log('   • A draft release will be created on GitHub')
    console.log('   • You\'ll need to manually publish the draft release')
    console.log('   • Users will receive auto-update notifications')

    // Interactive execution option
    const answer = await askQuestion('\n❓ Would you like me to execute these git commands? (y/N): ')

    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      console.log('\n⚡ Executing git commands...')

      console.log('📝 Adding changes...')
      exec('git add .')

      console.log('💾 Creating commit...')
      exec(`git commit -m "chore: release ${tagVersion}"`)

      console.log('🏷️  Creating tag...')
      exec(`git tag ${tagVersion}`)

      console.log('📤 Pushing to remote...')
      exec('git push origin main --tags')

      console.log(`\n🎊 Release ${tagVersion} has been published!`)
      console.log('📱 Check GitHub Actions: https://github.com/dannysmith/astro-editor/actions')
      console.log('📦 Draft release will appear at: https://github.com/dannysmith/astro-editor/releases')
      console.log('\n⚠️  Remember: You need to manually publish the draft release on GitHub!')
    } else {
      console.log('\n📝 Git commands saved for manual execution.')
      console.log('   Run them when you\'re ready to release.')
    }

  } catch (error) {
    console.error('\n❌ Pre-release preparation failed:', error.message)
    process.exit(1)
  }
}

// Run if this is the main module
prepareRelease()
```

## Release Process markdown docs (AI-generated and way too long atm)

This document explains how to create releases for Astro Editor using the automated GitHub Actions workflow.

### Method 1: Command Line

**Step 1: Prepare Release**

```bash
# Ensure you're on main branch and up to date
git checkout main
git pull origin main

# Verify everything works
npm run check:all
```

**Step 2: Update Version Numbers**

```bash
# Update package.json version (example: 0.1.0 → 0.1.1)
# Update src-tauri/Cargo.toml version to match
# You can do this manually or wait for the automation script
```

**Step 3: Create and Push Tag**

```bash
# Commit version changes first
git add package.json src-tauri/Cargo.toml src-tauri/tauri.conf.json
git commit -m "chore: bump version to 0.1.1"

# Create and push tag (this triggers the release workflow)
git tag v0.1.1
git push origin main --tags
```

### Method 2: GitHub Web Interface

**Step 1: Go to Releases**

- Navigate to your GitHub repository
- Click "Releases" in the right sidebar
- Click "Create a new release"

**Step 2: Create Tag**

- Click "Choose a tag" dropdown
- Type new tag name (e.g., `v0.1.1`)
- Click "Create new tag: v0.1.1 on publish"

**Step 3: Fill Release Info**

- Release title: `Astro Editor v0.1.1`
- Description: Brief summary of changes
- Click "Publish release"

### What Happens After Tagging

#### Automatic Workflow Steps

1. **Workflow Triggers** - GitHub Actions starts when tag is pushed
2. **Create Draft Release** - Initial release draft is created
3. **Multi-Platform Builds** - Builds for macOS, Windows, and Linux simultaneously
4. **Upload Assets** - All installers and updater files are attached
5. **Publish Release** - Draft becomes public release automatically

#### Build Artifacts Created

- `Astro Editor_0.1.1_universal.dmg` (macOS installer)
- `Astro Editor_0.1.1_x64_en-US.msi` (Windows installer)
- `astro-editor_0.1.1_amd64.deb` (Debian package)
- `astro-editor_0.1.1_amd64.AppImage` (Linux AppImage)
- `latest.json` (Auto-updater manifest)
- `.sig` signature files for verification

### Testing the Release System

#### Test 1: First Release

1. **Create Initial Release**

   ```bash
   # Start with version 0.1.0
   git tag v0.1.0
   git push origin main --tags
   ```

2. **Monitor Workflow**
   - Go to GitHub → Actions tab
   - Watch "Release Astro Editor" workflow
   - Should take 10-15 minutes to complete

3. **Verify Release**
   - Check GitHub → Releases
   - Download and test one installer
   - Confirm all expected files are present

#### Test 2: Auto-Update Testing

1. **Install First Release**
   - Download and install v0.1.0 from GitHub releases
   - Run the application

2. **Create Second Release**

   ```bash
   # Make a small change (e.g., update README)
   echo "Test update" >> README.md
   git add README.md
   git commit -m "test: minor change for update testing"

   # Update version to 0.1.1 in both package.json and Cargo.toml
   # Then create new release
   git tag v0.1.1
   git push origin main --tags
   ```

3. **Test Auto-Update**
   - Keep v0.1.0 app running
   - Wait 5 seconds after v0.1.1 release is published
   - Should see update notification dialog
   - Test the update process

### Branch Strategy

#### Current Setup: Trunk-Based Development

- **Main Branch**: `main` - All development and releases happen here
- **No Feature Branches**: Direct commits to main (suitable for single developer)
- **Release Tags**: Created from main branch commits

#### Release Workflow

```
main branch: ──●──●──●──●──●──●──●──
                    ↑        ↑
                 v0.1.0   v0.1.1
```

### Troubleshooting

#### Common Issues

**Workflow doesn't trigger:**

- Ensure tag starts with `v` (e.g., `v1.0.0`, not `1.0.0`)
- Check that tag was pushed: `git push origin --tags`

**Build fails:**

- Verify `TAURI_PRIVATE_KEY` secret is set correctly
- Check that all tests pass locally: `npm run check:all`

**Auto-update doesn't work:**

- Confirm updater endpoint URLs match your GitHub repository
- Verify public key in `tauri.conf.json` matches private key
- Check console logs in the app for error messages

**Version mismatches:**

- Ensure `package.json` and `src-tauri/Cargo.toml` versions match
- Tags should match the version in `package.json`

#### Manual Cleanup

**Delete a tag (if needed):**

```bash
# Delete local tag
git tag -d v0.1.0

# Delete remote tag
git push origin --delete v0.1.0
```

**Cancel a running workflow:**

- Go to GitHub → Actions → Select workflow run → Cancel

## Quick Reference Commands

```bash
# Check current version
grep '"version"' package.json

# List all tags
git tag -l

# Create and push tag
git tag v0.1.1 && git push origin main --tags

# Run all checks
npm run check:all
```
