You are helping a user initialize this template for their specific application. This command is typically run once when starting a new project.

## Step 1: Collect Information

Ask the user for:

1. **App Name**: What is the name of their application?
2. **App Description**: What does their app do? (1-2 sentences)

## Step 2: Process and Update Files

After receiving their input:

1. **Reword the description** to be coherent and professional
2. **Get GitHub username** using `gh api user --jq .login` or `git config user.name`
3. **Update `package.json`**: Set `name` (kebab-case) and `description`
4. **Update `src/index.html`**: Set `<title>` tag
5. **Update `AGENTS.md`**: Update the Overview section with app name and description
6. **Update `README.md`**: Replace "Tauri React Template" with app name, update description
7. **Update `src-tauri/tauri.conf.json`**:
   - `productName`: App name
   - `identifier`: `com.${githubUsername}.${kebab-case-app-name}`
   - `windows[0].title`: App name
   - `bundle.shortDescription` and `bundle.longDescription`
   - `bundle.publisher` and `bundle.copyright` with GitHub username
   - `plugins.updater.endpoints`: Update to use their GitHub username and repo name
8. **Update `src-tauri/Cargo.toml`**:
   - `name`: Kebab-case app name
   - `description`: Their description
   - `authors`: GitHub username
9. **Update `.github/workflows/release.yml`**:
   - Workflow `name`
   - Release name and body references
10. **Update `docs/SECURITY.md`**:
    - Replace `YOUR_SECURITY_EMAIL` with appropriate contact (or GitHub username if no email)
11. **Update `docs/CONTRIBUTING.md`**:
    - Replace `YOUR_USERNAME/YOUR_REPO` with their GitHub username and repo name

## Step 3: Verify

Run these commands:

```bash
npm install
npm run check:all
```

Fix any errors before proceeding.

## Step 4: Next Steps

Summarize what was updated, then guide the user:

1. **Try the app**: Run `npm run tauri:dev` to verify everything works
2. **Set up releases** (if using GitHub Actions): See `docs/developer/releases.md` for signing key generation and GitHub secrets
3. **Explore the codebase**:
   - Read `docs/developer/architecture-guide.md` for patterns
   - Try the command palette (Cmd+K)
   - Try `/check` before finishing work sessions
4. **Clean up**: Once comfortable, delete `docs/USING_THIS_TEMPLATE.md`
