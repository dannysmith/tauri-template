# Using This Template

This document is specific to the template and should be deleted once you're comfortable with your new project.

## Prerequisites

Before you begin, install:

- **Node.js** (v18+) - [nodejs.org](https://nodejs.org/)
- **Rust** (latest stable) - [rustup.rs](https://rustup.rs/)
- **Platform dependencies**:
  - **macOS**: `xcode-select --install`
  - **Windows**: [Microsoft C++ Build Tools](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
  - **Linux**: See [Tauri prerequisites](https://tauri.app/start/prerequisites/)

Then clone this template and install dependencies:

```bash
git clone <your-repo-url>
cd <your-project>
npm install
```

## Quick Setup (Claude Code)

If you're using Claude Code, run the `/init` command:

```
/init
```

This will prompt you for your app name and description, then automatically update all configuration files. Once complete, verify everything works:

```bash
npm run tauri:dev
```

## Manual Setup

If you're not using Claude Code, update these files manually:

### Configuration Checklist

| File                            | Fields to Update                                                               |
| ------------------------------- | ------------------------------------------------------------------------------ |
| `package.json`                  | `name`, `description`                                                          |
| `src/index.html`                | `<title>` tag                                                                  |
| `src-tauri/tauri.conf.json`     | `productName`, `identifier`, `windows[0].title`, bundle info, updater endpoint |
| `src-tauri/Cargo.toml`          | `name`, `description`, `authors`                                               |
| `.github/workflows/release.yml` | Workflow name, release name                                                    |
| `AGENTS.md`                     | Overview section with app name/description                                     |
| `README.md`                     | Replace template references with your app                                      |
| `docs/SECURITY.md`              | Replace `YOUR_SECURITY_EMAIL` placeholder                                      |
| `docs/CONTRIBUTING.md`          | Replace `YOUR_USERNAME/YOUR_REPO` placeholder                                  |

### Identifier Format

Use reverse domain notation: `com.yourusername.your-app-name`

You can get your GitHub username with:

```bash
gh api user --jq .login
```

### Verify Setup

```bash
npm run check:all
npm run tauri:dev
```

## Example AI Workflow

This template includes workflow features designed for AI-assisted development. Here's an example workflow:

### 1. Plan with Task Documents

Create a task document in `docs/tasks-todo/` describing what you want to build. Ask the AI to read relevant docs and help plan the implementation. Task documents help maintain context across sessions.

### 2. Implement Iteratively

Build the feature, running quality checks periodically:

```bash
npm run check:all
```

This runs TypeScript, ESLint, Prettier, Rust checks, and tests in one command.

### 3. Check Before Finishing

In Claude Code, run `/check` before finishing a session. This verifies your work follows the architecture patterns in `docs/developer/` and cleans up any leftover debug code.

### 4. Update Documentation

Ask the AI to update relevant developer docs in `docs/developer/` and the user guide in `docs/userguide/` to reflect new patterns or features.

### 5. Complete the Task

Move the task document to mark it done:

```bash
npm run task:complete <task-name>
```

## Setting Up GitHub Releases

To enable automated builds and auto-updates via GitHub Actions:

### 1. Generate Signing Keys

```bash
npm install -g @tauri-apps/cli
tauri signer generate -w ~/.tauri/myapp.key
```

Save the displayed public key for the next step.

### 2. Add GitHub Secrets

In your repository: Settings → Secrets and variables → Actions

- `TAURI_PRIVATE_KEY`: Contents of `~/.tauri/myapp.key`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`: Your key password (if set)

### 3. Update Public Key

Add your public key to `src-tauri/tauri.conf.json`:

```json
{
  "plugins": {
    "updater": {
      "pubkey": "YOUR_PUBLIC_KEY_HERE"
    }
  }
}
```

See [docs/developer/releases.md](developer/releases.md) for the full release process and auto-update system.

## Next Steps

1. **Try the app**: `npm run tauri:dev`
2. **Explore features**: Open command palette (Cmd+K), check preferences (Cmd+,)
3. **Read the docs**: Start with [docs/developer/architecture-guide.md](developer/architecture-guide.md)
4. **Set up releases**: Follow the GitHub Releases section above if using CI/CD
5. **Delete this file**: Once you're comfortable, remove `docs/USING_THIS_TEMPLATE.md`
