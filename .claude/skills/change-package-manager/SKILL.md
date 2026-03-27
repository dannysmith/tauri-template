---
name: change-package-manager
description: Switch the project's package manager between npm, bun, and pnpm. Updates all config, scripts, documentation, CI workflows, and AI instructions. Use when initializing from template or switching package managers.
user-invocable: true
argument-hint: <bun|pnpm|npm>
allowed-tools: [Read, Edit, Write, Bash, Glob, Grep]
---

Switch this project's package manager to **$ARGUMENTS**.

If `$ARGUMENTS` is not exactly `bun`, `pnpm`, or `npm`, ask the user which package manager they want.

## Command Mapping Reference

Detect the current package manager from `AGENTS.md` or `package.json` scripts. Use this table for all replacements:

| Context | npm | bun | pnpm |
|---------|-----|-----|------|
| Install deps | `npm install` | `bun install` | `pnpm install` |
| Run script | `npm run X` | `bun run X` | `pnpm run X` |
| CI frozen install | `npm ci` | `bun install --frozen-lockfile` | `pnpm install --frozen-lockfile` |
| Add dep | `npm install pkg` | `bun add pkg` | `pnpm add pkg` |
| Add dev dep | `npm install -D pkg` | `bun add -D pkg` | `pnpm add -D pkg` |
| Remove dep | `npm uninstall pkg` | `bun remove pkg` | `pnpm remove pkg` |
| Audit | `npm audit` | `bun audit` | `pnpm audit` |
| Global install | `npm install -g pkg` | `bun install -g pkg` | `pnpm add -g pkg` |
| Execute binary | `npx` | `bunx` | `pnpm dlx` |
| Lock file | `package-lock.json` | `bun.lock` | `pnpm-lock.yaml` |

## Step 1: Functional Config

### package.json scripts

Read `package.json`. Replace the current PM's `run` command with the target PM's in all script values. For example, `npm run typecheck` becomes `bun run typecheck`.

### tauri.conf.json

Read `src-tauri/tauri.conf.json`. Update `beforeDevCommand` and `beforeBuildCommand`.

### GitHub Actions CI

Read `.github/workflows/release.yml` and apply the appropriate pattern:

**Target: bun**
- Replace the `Setup Node.js` step with:
  ```yaml
  - name: Setup Bun
    uses: oven-sh/setup-bun@v2
  ```
- Replace `npm ci` with `bun install --frozen-lockfile`

**Target: pnpm**
- Add a step before `Setup Node.js`:
  ```yaml
  - name: Setup pnpm
    uses: pnpm/action-setup@v4
  ```
- Change `cache: 'npm'` to `cache: 'pnpm'` in the setup-node step
- Replace `npm ci` with `pnpm install --frozen-lockfile`

**Target: npm**
- Ensure standard `actions/setup-node@v4` with `cache: 'npm'`
- Ensure `npm ci` for install step
- Remove any pnpm/bun setup steps

## Step 2: Lock File

- Delete the old lock file (whichever of `package-lock.json`, `bun.lock`, `pnpm-lock.yaml` exists)
- Run the target PM's install command to generate the new lock file

## Step 3: AI Instructions & Claude Config

Update these files, replacing PM commands contextually:

- **`AGENTS.md`**: Update rule 0 (the "Use npm only" line) to reflect the new PM. For example: `0. **Use bun only**: This project uses \`bun\`, NOT \`npm\`. Always use \`bun install\`, \`bun run\`, etc.`
- **`.claude/skills/init/SKILL.md`**: Replace PM commands in verification/next-steps sections
- **`.claude/skills/check/SKILL.md`**: Replace PM commands
- **`.claude/agents/cleanup-analyzer.md`**: Replace PM commands
- **`.claude/settings.local.json`**: Update `Bash(npm ...)` permission patterns to use the new PM (e.g. `Bash(bun run format:*)`)

## Step 4: Documentation

Use Grep to find all remaining references to the old PM across the codebase. Update every documentation file, making sentences read naturally — don't do blind find-replace on prose.

Key files to check:
- `README.md`
- `docs/USING_THIS_TEMPLATE.md`
- `docs/CONTRIBUTING.md`
- `docs/SECURITY.md`
- `docs/tasks.md`
- All files under `docs/developer/`
- `scripts/prepare-release.js` (help text)

## Step 5: Verify

Run a final search for any remaining references to the old PM:

```bash
grep -rn "OLD_PM_NAME" --include="*.md" --include="*.json" --include="*.yml" --include="*.js" --include="*.ts" . | grep -v node_modules | grep -v ".lock"
```

Review any remaining hits — some are intentional (`.gitignore` entries, `.cursorignore` patterns listing all PM artifacts).

## Important Rules

- **Do NOT change** `.gitignore` or `.cursorignore` — these intentionally list artifacts for all PMs
- **Do NOT change** references to `node_modules/` — all three PMs use this directory
- **Preserve natural prose** in docs — make sentences read correctly, don't just swap words
- **npx** → `bunx` (bun) or `pnpm dlx` (pnpm)
- If the target PM is already in use, inform the user and stop
